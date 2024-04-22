import { clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import dayjs from "dayjs";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
import inRateWindow from "../helpers/inRateWindow";

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
      await inRateWindow(ctx.userId);

      // Purchase Report
      const tranItemLinks = await ctx.db.transactionItems
        .findMany({
          where: {
            createdAt: {
              gte: input.purchaseReport?.startDate,
              lte: input.purchaseReport?.endDate,
            },
          },
          include: {
            item: true,
          },
        })
        .then((dbLinks) =>
          dbLinks.filter((l) => {
            if (l.item.isAdmissionItem) {
              return input.purchaseReport?.includeAdmissions;
            } else if (l.item.isConcessionItem) {
              return input.purchaseReport?.includeConcessions;
            }
          }),
        );

      const users = await clerkClient.users
        .getUserList({ userId: tranItemLinks.map((l) => l.createdBy) })
        .then((res) => res.filter(filterUserForClient));

      let admissionTotal = 0;
      let concessionTotal = 0;
      let admissionCount = 0;
      let concessionCount = 0;
      tranItemLinks.forEach((l) => {
        if (l.item.isAdmissionItem) {
          admissionTotal += l.amountSold * l.item.sellingPrice;
          admissionCount += l.amountSold;
        } else if (l.item.isConcessionItem) {
          concessionTotal += l.amountSold * l.item.sellingPrice;
          concessionCount += l.amountSold;
        }
        // Warning: improper use of field for UI
        l.createdBy =
          users.find((u) => u.id === l.createdBy)?.username ?? l.createdBy;
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

      // Timecard Report
      const [start, end] = [
        dayjs(input.timecardReport?.startDate)
          .startOf("day")
          .toDate(),
        dayjs(input.timecardReport?.endDate)
          .endOf("day")
          .toDate(),
      ];
      // todo modify for tc v2, switch to timeClockEvents, if odd - return flag
      const tces = await ctx.db.timeClockEvent.findMany({
        where: {
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
      type Shift = {
        userId: string;
        clockIn: Date;
        clockOut?: Date;
      };
      type Timecard = {
        user: { id: string; username: string };
        period: [start: Date, end: Date];
        totalWorkedMs: number;
        shifts: Shift[];
      }[];
      const userIdList = new Set(tces.map((t) => t.userId));
      const tcUsers = await clerkClient.users
        .getUserList({ userId: Array.from(userIdList) })
        .then((res) => res.filter(filterUserForClient));

      // todo recalculate shifts & totalMsWorked
      const shiftsByUser: Timecard = tces.reduce((acc, tce) => {
        const existingUser = acc.find((user) => user.user.id === tce.userId);

        if (existingUser) {
          const wrkingShift =
            existingUser.shifts[existingUser.shifts.length - 1];
          // last punch completed a shift
          if (!!wrkingShift?.clockOut) {
            existingUser.shifts.push({
              userId: tce.userId,
              clockIn: tce.createdAt,
            });
            // last punch opened a shift
          } else {
            wrkingShift!.clockOut = tce.createdAt;
            existingUser.totalWorkedMs += dayjs(wrkingShift?.clockOut).diff(
              dayjs(wrkingShift?.clockIn),
            );
          }
        } else {
          acc.push({
            user: {
              id: tce.userId,
              username:
                tcUsers.find((u) => u.id === tce.userId)?.username ??
                "Not Found",
            },
            shifts: [{ userId: tce.userId, clockIn: tce.createdAt }],
            totalWorkedMs: 0,
            period: [start, end],
          });
        }
        return acc;
      }, [] as Timecard);

      return {
        purchaseReport: !!input.purchaseReport
          ? {
              startDate: input.purchaseReport?.startDate,
              endDate: input.purchaseReport?.endDate,
              transactions: tranItemLinks,
              summary: {
                admissionTotal,
                admissionCount,
                concessionTotal,
                concessionCount,
              },
            }
          : null,
        admissionReport: !!input.admissionReport
          ? {
              startDate: input.admissionReport?.startDate,
              endDate: input.admissionReport?.endDate,
              admissionEvents: adEvents,
            }
          : null,
        timecardReport: !!input.timecardReport
          ? { shifts: shiftsByUser }
          : null,
      };
    }),
});
