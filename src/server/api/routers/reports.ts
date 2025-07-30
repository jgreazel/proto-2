import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import dayjs from "dayjs";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";

const MS_IN_HOUR = 1000 * 60 * 60;

type Shift = {
  userId: string;
  clockIn: Date;
  clockOut?: Date;
  rate: number;
};
type Timecard = {
  user: { id: string; username: string };
  period: [start: Date, end: Date];
  totalWorkedMs: number;
  totalEarned: number;
  shifts: Shift[];
}[];

export const reportsRouter = createTRPCRouter({
  // todo: only query db if input params dictate so
  getNew: privateProcedure
    .input(
      z.object({
        purchaseReport: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
            includeAdmissions: z.boolean().default(false).optional(),
            includeConcessions: z.boolean().default(false).optional(),
          })
          .optional()
          .nullable(),
        admissionReport: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional()
          .nullable(),
        itemChangeLogReport: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional()
          .nullable(),
        timecardReport: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional()
          .nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Purchase Report
      const transactions = await ctx.db.transaction.findMany({
        where: {
          createdAt: {
            gte: input.purchaseReport?.startDate,
            lte: input.purchaseReport?.endDate,
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Filter and process transactions to include void information
      const processedTransactions = transactions
        .map((transaction) => {
          // Filter items based on report criteria
          const filteredItems = transaction.items.filter((transactionItem) => {
            if (transactionItem.item.isAdmissionItem) {
              return input.purchaseReport?.includeAdmissions;
            } else if (transactionItem.item.isConcessionItem) {
              return input.purchaseReport?.includeConcessions;
            }
            return false;
          });

          // Skip transactions with no matching items
          if (filteredItems.length === 0) {
            return null;
          }

          // Calculate transaction total for filtered items
          const transactionTotal = filteredItems.reduce(
            (sum, transactionItem) =>
              sum +
              transactionItem.amountSold * transactionItem.item.sellingPrice,
            0,
          );

          return {
            id: transaction.id,
            createdAt: transaction.createdAt,
            createdBy: transaction.createdBy,
            isVoided: transaction.isVoided,
            voidedAt: transaction.voidedAt,
            voidedBy: transaction.voidedBy,
            voidReason: transaction.voidReason,
            total: transactionTotal,
            items: filteredItems.map((transactionItem) => ({
              id: transactionItem.item.id,
              label: transactionItem.item.label,
              amountSold: transactionItem.amountSold,
              unitPrice: transactionItem.item.sellingPrice,
              lineTotal:
                transactionItem.amountSold * transactionItem.item.sellingPrice,
              isAdmissionItem: transactionItem.item.isAdmissionItem,
              isConcessionItem: transactionItem.item.isConcessionItem,
              category: transactionItem.item.category,
            })),
          };
        })
        .filter((transaction) => transaction !== null);

      // Get all unique user IDs for username lookup
      const allUserIds = [
        ...new Set([
          ...processedTransactions.map((t) => t.createdBy),
          ...processedTransactions
            .filter((t) => t.voidedBy)
            .map((t) => t.voidedBy!),
        ]),
      ];

      const users = await clerkClient.users
        .getUserList({
          userId: allUserIds,
          limit: 500,
        })
        .then((res) => res.filter(filterUserForClient));

      // Calculate totals (excluding voided transactions for active totals)
      let admissionTotal = 0;
      let concessionTotal = 0;
      let admissionCount = 0;
      let concessionCount = 0;
      let voidedAdmissionTotal = 0;
      let voidedConcessionTotal = 0;
      let voidedAdmissionCount = 0;
      let voidedConcessionCount = 0;

      processedTransactions.forEach((transaction) => {
        transaction.items.forEach((item) => {
          if (item.isAdmissionItem) {
            if (transaction.isVoided) {
              voidedAdmissionTotal += item.lineTotal;
              voidedAdmissionCount += item.amountSold;
            } else {
              admissionTotal += item.lineTotal;
              admissionCount += item.amountSold;
            }
          } else if (item.isConcessionItem) {
            if (transaction.isVoided) {
              voidedConcessionTotal += item.lineTotal;
              voidedConcessionCount += item.amountSold;
            } else {
              concessionTotal += item.lineTotal;
              concessionCount += item.amountSold;
            }
          }
        });

        // Update usernames
        transaction.createdBy =
          users.find((u) => u.id === transaction.createdBy)?.username ??
          transaction.createdBy;
        if (transaction.voidedBy) {
          transaction.voidedBy =
            users.find((u) => u.id === transaction.voidedBy)?.username ??
            transaction.voidedBy;
        }
      });

      // Admission Report
      const adEvents = await ctx.db.admissionEvent.findMany({
        where: {
          createdAt: {
            gte: input.admissionReport?.startDate,
            lte: input.admissionReport?.endDate,
          },
        },
        include: {
          patron: true,
        },
      });
      adEvents.forEach((e) => {
        // Warning: improper use of field for UI
        e.createdBy =
          users.find((u) => u.id === e.createdBy)?.username ?? e.createdBy;
      });
      const nonMemberTransLinks = await ctx.db.transactionItems
        .findMany({
          where: {
            createdAt: {
              gte: input.admissionReport?.startDate,
              lte: input.admissionReport?.endDate,
            },
          },
          include: {
            item: true,
          },
        })
        .then((dbLinks) => dbLinks.filter((l) => l.item.isAdmissionItem));
      nonMemberTransLinks.forEach((l) => {
        l.createdBy =
          users.find((u) => u.id === l.createdBy)?.username ?? l.createdBy;
      });
      type AdmissionWithTag = (typeof adEvents)[number] & { type: "admission" };
      type TransactionWithTag = (typeof nonMemberTransLinks)[number] & {
        type: "transaction";
      };

      type CombinedAdmission = AdmissionWithTag | TransactionWithTag;
      const combinedAdmissionEvents: CombinedAdmission[] = [
        ...adEvents.map((e) => ({ ...e, type: "admission" as const })),
        ...nonMemberTransLinks.map((l) => ({
          ...l,
          type: "transaction" as const,
        })),
      ].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      // ItemChangeLog Report
      const itemChangeLogs = await ctx.db.itemChangeLog.findMany({
        where: {
          createdAt: {
            gte: input.itemChangeLogReport?.startDate,
            lte: input.itemChangeLogReport?.endDate,
          },
        },
        include: {
          item: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Enhance with user information
      const changeLogUserIds = [
        ...new Set(itemChangeLogs.map((log) => log.userId)),
      ];
      const changeLogUsers = await clerkClient.users
        .getUserList({
          userId: changeLogUserIds,
          limit: 500,
        })
        .then((res) => res.filter(filterUserForClient));

      itemChangeLogs.forEach((log) => {
        // Warning: improper use of field for UI - following existing pattern
        (log as any).userId =
          changeLogUsers.find((u) => u.id === log.userId)?.username ??
          log.userId;
      });

      // Calculate summary statistics
      const totalChanges = itemChangeLogs.length;
      const priceChanges = itemChangeLogs.filter(
        (log) =>
          log.changeNote?.toLowerCase().includes("price") ||
          (log.oldValues &&
            log.newValues &&
            JSON.stringify(log.oldValues).includes("sellingPrice")) ||
          JSON.stringify(log.newValues).includes("sellingPrice"),
      ).length;
      const stockChanges = itemChangeLogs.filter(
        (log) =>
          log.changeNote?.toLowerCase().includes("stock") ||
          (log.oldValues &&
            log.newValues &&
            JSON.stringify(log.oldValues).includes("inStock")) ||
          JSON.stringify(log.newValues).includes("inStock"),
      ).length;
      const otherChanges = totalChanges - priceChanges - stockChanges;

      return {
        purchaseReport: !!input.purchaseReport
          ? {
              startDate: input.purchaseReport?.startDate,
              endDate: input.purchaseReport?.endDate,
              transactions: processedTransactions,
              summary: {
                admissionTotal,
                admissionCount,
                concessionTotal,
                concessionCount,
                voidedAdmissionTotal,
                voidedConcessionTotal,
                voidedAdmissionCount,
                voidedConcessionCount,
                totalTransactions: processedTransactions.length,
                voidedTransactions: processedTransactions.filter(
                  (t) => t.isVoided,
                ).length,
              },
            }
          : null,
        admissionReport: !!input.admissionReport
          ? {
              startDate: input.admissionReport?.startDate,
              endDate: input.admissionReport?.endDate,
              admissionEvents: combinedAdmissionEvents,
            }
          : null,
        itemChangeLogReport: !!input.itemChangeLogReport
          ? {
              startDate: input.itemChangeLogReport?.startDate,
              endDate: input.itemChangeLogReport?.endDate,
              changeLogs: itemChangeLogs,
              summary: {
                totalChanges,
                priceChanges,
                stockChanges,
                otherChanges,
              },
            }
          : null,
      };
    }),
});
