import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";
import dayjs from "dayjs";

const ONEYEARMILLIS = 86400000;

export const schedulesRouter = createTRPCRouter({
  getShifts: privateProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        dateRange: z.tuple([z.date(), z.date()]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const shifts = await ctx.db.shift.findMany({
        where: {
          userId: input.userId,
          start: {
            gte: input.dateRange?.[0],
          },
          end: {
            lte: input.dateRange?.[1],
          },
        },
        orderBy: {
          start: "asc",
        },
      });
      return Promise.all(
        shifts.map(async (s) => ({
          ...s,
          username: (await clerkClient.users.getUser(s.userId)).username,
        })),
      );
    }),

  createShift: privateProcedure
    .input(
      z.object({
        userId: z.string(),
        start: z.date(),
        end: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      // await inRateWindow(createdById);

      const shift = await ctx.db.shift.create({
        data: {
          ...input,
          createdBy: createdById,
        },
      });
      if (!shift) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new shift",
        });
      }
      const username = (await clerkClient.users.getUser(shift.userId)).username;

      return { ...shift, username };
    }),

  editShift: privateProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        start: z.date().optional(),
        end: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const shift = await ctx.db.shift.update({
        where: { id: input.id },
        data: {
          ...input,
        },
      });
      if (!shift) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new shift",
        });
      }
      const username = (await clerkClient.users.getUser(shift.userId)).username;
      return { ...shift, username };
    }),

  deleteShift: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const result = await ctx.db.shift.delete({
        where: { id: input.id },
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete shift",
        });
      }
      return result;
    }),

  // safest to use source.startof('day') on the UI
  cloneDay: privateProcedure
    .input(z.object({ source: z.date(), target: z.date() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const srcBegin = new Date(input.source);
      srcBegin.setHours(0, 0, 0, 0);
      const srcShifts = await ctx.db.shift.findMany({
        where: {
          start: {
            gte: srcBegin,
            lt: new Date(input.source.getTime() + ONEYEARMILLIS),
          },
        },
      });

      const shiftsToAdd = srcShifts.map((s) => {
        const targetStart = new Date(s.start);
        targetStart.setFullYear(input.target.getFullYear());
        targetStart.setMonth(input.target.getMonth());
        targetStart.setDate(input.target.getDate());

        const targetEnd = new Date(s.end);
        targetEnd.setFullYear(input.target.getFullYear());
        targetEnd.setMonth(input.target.getMonth());
        targetEnd.setDate(input.target.getDate());

        return {
          userId: s.userId,
          start: targetStart,
          end: targetEnd,
          createdBy: ctx.userId,
        };
      });
      const result = await ctx.db.shift.createMany({
        data: shiftsToAdd,
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to clone shifts",
        });
      }
      return result;
    }),

  createHourCode: privateProcedure
    .input(
      z.object({
        label: z.string(),
        hourlyRate: z.number().min(725),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      // await inRateWindow(ctx.userId);

      const hc = await ctx.db.hourCode.create({
        data: {
          label: input.label,
          hourlyRate: input.hourlyRate,
          createdBy: createdById,
        },
      });
      if (!hc) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create the Hour Code object in the Database.",
        });
      }
      return hc;
    }),

  getHourCodes: privateProcedure.query(
    async ({ ctx }) => await ctx.db.hourCode.findMany(),
  ),

  editHourCode: privateProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string(),
        hourlyRate: z.number().min(725),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const hc = await ctx.db.hourCode.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!hc) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new Hour Code",
        });
      }
      return hc;
    }),

  deleteHourCode: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const result = await ctx.db.hourCode.delete({
        where: { id: input.id },
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete Hour Code",
        });
      }
      return result;
    }),

  // new
  createTimeClockEvent: privateProcedure
    .input(
      z.object({
        hourCodeId: z.string(),
        clockPIN: z.string().length(4).optional(),
        userId: z.string(),
        manualDateTime: z.date().optional(),
        adminUserId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      // await inRateWindow(createdById);

      const userSettings = await ctx.db.userSettings.findFirst({
        where: { userId: input.userId },
      });
      if (!userSettings?.defaultHourCodeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No default hour code found in user settings. Please add one to the user's permissions.",
        });
      }

      const adminUser = await ctx.db.userSettings.findFirst({
        where: { userId: input.adminUserId },
      });

      const pinMismatch =
        input.clockPIN?.toUpperCase() !== userSettings.clockPIN?.toUpperCase();
      // admin can create manual TC events to make corrections
      if (pinMismatch && !adminUser?.isAdmin) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Incorrect Clock PIN" + `isadmin: ${userSettings.isAdmin}`,
        });
      }

      let workingHourCode = input?.hourCodeId ?? "";
      if (!input) {
        workingHourCode = userSettings.defaultHourCodeId;
      }

      const tce = await ctx.db.timeClockEvent.create({
        data: {
          userId: input.userId,
          hourCodeId: workingHourCode,
          createdBy: createdById,
          createdAt: input.manualDateTime ?? undefined,
        },
      });

      if (!tce) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create Time Clock event.",
        });
      }
      return tce;
    }),

  // todo remove PIN from response
  getShiftsByUser: privateProcedure
    .input(
      z.object({
        dateRange: z.tuple([z.date(), z.date()]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const shifts = await ctx.db.shift.findMany({
        where: {
          start: {
            gte: input.dateRange?.[0],
          },
          end: {
            lte: input.dateRange?.[1],
          },
        },
        orderBy: {
          start: "asc",
        },
      });
      const users = await clerkClient.users.getUserList({
        limit: 500,
      });
      const settings = await ctx.db.userSettings.findMany();
      const tces = await ctx.db.timeClockEvent.findMany({
        where: {
          createdAt: {
            gte: input.dateRange?.[0],
            lte: input.dateRange?.[1],
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const groupedResult = users.map((u) => {
        const fu = filterUserForClient(u);
        const uShifts = shifts.filter((s) => s.userId === u.id);
        const uSetts = settings.find((s) => s.userId === u.id);
        const uTces = tces.filter((t) => t.userId === u.id);
        return {
          user: fu,
          shifts: uShifts,
          settings: uSetts,
          timeClockEvents: uTces,
        };
      });
      const sortedResult = groupedResult.sort((a, b) => {
        // Extract the start dates, handling possible null/undefined values
        const aStart = a.shifts?.[0]?.start
          ? new Date(a.shifts[0].start)
          : null;
        const bStart = b.shifts?.[0]?.start
          ? new Date(b.shifts[0].start)
          : null;

        // Convert dates to timestamps (number)
        const aTime = aStart ? aStart.getTime() : null;
        const bTime = bStart ? bStart.getTime() : null;

        // If both starts are null, they are considered equal
        if (aTime === null && bTime === null) {
          return 0;
        }

        // If aTime is null, place b before a
        if (aTime === null) {
          return 1;
        }

        // If bTime is null, place a before b
        if (bTime === null) {
          return -1;
        }

        // If both start dates exist, compare them
        return aTime - bTime;
      });

      return sortedResult;
    }),
});
