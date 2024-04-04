import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Shift } from "@prisma/client";
import dayjs from "dayjs";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import { filterUserForClient } from "../helpers/filterUsersForClient";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

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
      // Rate Limit check
      const createdById = ctx.userId;
      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

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
      const shifts = await ctx.db.shift.findMany({
        where: {
          start: {
            gte: start,
          },
          end: {
            lte: end,
          },
          clockIn: { not: null },
          clockOut: { not: null },
        },
        orderBy: {
          start: "asc",
        },
      });
      type Timecard = {
        user: { id: string; username: string };
        period: [start: Date, end: Date];
        totalWorkedMs: number;
        shifts: Shift[];
      }[];
      const tcUsers = await clerkClient.users
        .getUserList({ userId: shifts.map((s) => s.userId) })
        .then((res) => res.filter(filterUserForClient));
      const shiftsByUser: Timecard = shifts.reduce((acc, shift) => {
        const existingUser = acc.find((user) => user.user.id === shift.userId);
        const timeDiff = dayjs(shift.clockOut).diff(dayjs(shift.clockIn));

        if (existingUser) {
          existingUser.shifts.push(shift);
          existingUser.totalWorkedMs += timeDiff;
        } else {
          acc.push({
            user: {
              id: shift.userId,
              username:
                tcUsers.find((u) => u.id === shift.userId)?.username ??
                "Not Found",
            },
            shifts: [shift],
            totalWorkedMs: timeDiff,
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
