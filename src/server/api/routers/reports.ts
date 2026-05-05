import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";

import {
  createTRPCRouter,
  orgProcedure,
  orgAdminProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";

export const reportsRouter = createTRPCRouter({
  // todo: only query db if input params dictate so
  getNew: orgAdminProcedure
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
          organizationId: ctx.organizationId,
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
          ...processedTransactions.map((t) => t!.createdBy),
          ...processedTransactions
            .filter((t) => t!.voidedBy)
            .map((t) => t!.voidedBy!),
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
        transaction!.items.forEach((item) => {
          if (item.isAdmissionItem) {
            if (transaction!.isVoided) {
              voidedAdmissionTotal += item.lineTotal;
              voidedAdmissionCount += item.amountSold;
            } else {
              admissionTotal += item.lineTotal;
              admissionCount += item.amountSold;
            }
          } else if (item.isConcessionItem) {
            if (transaction!.isVoided) {
              voidedConcessionTotal += item.lineTotal;
              voidedConcessionCount += item.amountSold;
            } else {
              concessionTotal += item.lineTotal;
              concessionCount += item.amountSold;
            }
          }
        });

        // Update usernames
        transaction!.createdBy =
          users.find((u) => u.id === transaction!.createdBy)?.username ??
          transaction!.createdBy;
        if (transaction!.voidedBy) {
          transaction!.voidedBy =
            users.find((u) => u.id === transaction!.voidedBy)?.username ??
            transaction!.voidedBy;
        }
      });

      // Admission Report
      const adEvents = await ctx.db.admissionEvent.findMany({
        where: {
          organizationId: ctx.organizationId,
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
            transaction: { organizationId: ctx.organizationId },
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
          organizationId: ctx.organizationId,
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
        (log as typeof log & { userId: string }).userId =
          changeLogUsers.find((u) => u.id === log.userId)?.username ??
          log.userId;
      });

      // Calculate summary statistics
      const totalChanges = itemChangeLogs.length;
      /* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
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
      /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
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
                  (t) => t!.isVoided,
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
        timecardReport: null,
      };
    }),

  // ── Saved Reports ──────────────────────────────────────
  getSavedReports: orgProcedure.query(async ({ ctx }) => {
    return ctx.db.savedReport.findMany({
      where: { userId: ctx.userId, organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }),

  // ── Hours Worked Report ─────────────────────────────────
  getHoursReport: orgAdminProcedure
    .input(z.object({ startDate: z.date(), endDate: z.date() }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.timeClockEvent.findMany({
        where: {
          organizationId: ctx.organizationId,
          createdAt: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { createdAt: "asc" },
      });

      // Get org memberships to resolve display names
      const memberships = await ctx.db.organizationMembership.findMany({
        where: { organizationId: ctx.organizationId },
      });

      // Resolve Clerk display names for non-PIN-only accounts
      const clerkUserIds = [...new Set(events.map((e) => e.userId))].filter(
        (id) => memberships.find((m) => m.userId === id),
      );
      const clerkUsers =
        clerkUserIds.length > 0
          ? await clerkClient.users
              .getUserList({ userId: clerkUserIds, limit: 500 })
              .then((res) =>
                res.map((u) => ({
                  id: u.id,
                  displayName:
                    (u.firstName && u.lastName
                      ? `${u.firstName} ${u.lastName}`
                      : null) ??
                    u.username ??
                    u.id,
                })),
              )
          : [];

      const getDisplayName = (userId: string) => {
        const clerk = clerkUsers.find((u) => u.id === userId);
        if (clerk) return clerk.displayName;
        const membership = memberships.find((m) => m.userId === userId || m.id === userId);
        return membership?.displayName ?? userId;
      };

      // Group events by userId
      const byUser = new Map<string, typeof events>();
      events.forEach((e) => {
        if (!byUser.has(e.userId)) byUser.set(e.userId, []);
        byUser.get(e.userId)!.push(e);
      });

      type Shift = { clockIn: Date; clockOut: Date | null; minutesWorked: number | null };
      type UserSummary = {
        userId: string;
        displayName: string;
        totalMinutes: number;
        openShift: boolean;
        shifts: Shift[];
      };

      const userSummaries: UserSummary[] = [];

      byUser.forEach((userEvents, userId) => {
        const sorted = [...userEvents].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        const shifts: Shift[] = [];
        let totalMinutes = 0;
        let openShift = false;

        for (let i = 0; i < sorted.length; i += 2) {
          const clockIn = sorted[i]!;
          const clockOut = sorted[i + 1] ?? null;
          const minutes = clockOut
            ? (new Date(clockOut.createdAt).getTime() - new Date(clockIn.createdAt).getTime()) / 60000
            : null;
          if (minutes !== null) totalMinutes += minutes;
          if (i + 1 >= sorted.length) openShift = true;
          shifts.push({
            clockIn: clockIn.createdAt,
            clockOut: clockOut?.createdAt ?? null,
            minutesWorked: minutes,
          });
        }

        userSummaries.push({
          userId,
          displayName: getDisplayName(userId),
          totalMinutes,
          openShift,
          shifts,
        });
      });

      userSummaries.sort((a, b) => a.displayName.localeCompare(b.displayName));

      return {
        startDate: input.startDate,
        endDate: input.endDate,
        users: userSummaries,
        totalMinutesAllStaff: userSummaries.reduce((s, u) => s + u.totalMinutes, 0),
      };
    }),

  createSavedReport: orgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        reportType: z.string(),
        datePreset: z.string().optional().nullable(),
        customStart: z.date().optional().nullable(),
        customEnd: z.date().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.savedReport.create({
        data: {
          ...input,
          userId: ctx.userId,
          organizationId: ctx.organizationId,
        },
      });
    }),

  deleteSavedReport: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.savedReport.delete({
        where: { id: input.id, userId: ctx.userId, organizationId: ctx.organizationId },
      });
    }),
});
