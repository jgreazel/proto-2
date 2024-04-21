import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
import inRateWindow from "../helpers/inRateWindow";

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
      await inRateWindow(ctx.userId);

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
      await inRateWindow(createdById);

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
      await inRateWindow(ctx.userId);

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
      await inRateWindow(ctx.userId);

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
      await inRateWindow(ctx.userId);

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

  // old
  // todo: create new for tc v2, then remove once everything's transferred
  clockInOrOut: privateProcedure
    .input(
      z.object({
        shiftId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const shift = await ctx.db.shift.findUnique({
        where: { id: input.shiftId },
      });
      if (!shift)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Shift does not exist",
        });
      if (shift.userId !== ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "The shift you're trying to clock in/out for is not assigned to you",
        });
      }
      const isClockingIn = !shift.clockIn;
      // todo don't allow clocking in more than 30 min early
      const updateData = isClockingIn
        ? { clockIn: new Date() }
        : { clockOut: new Date() };
      const updatedShift = await ctx.db.shift.update({
        where: {
          id: input.shiftId,
        },
        data: updateData,
      });
      return updatedShift;
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
      await inRateWindow(ctx.userId);

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
      await inRateWindow(ctx.userId);

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
      await inRateWindow(ctx.userId);

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
        clockPIN: z.string().length(4),
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      await inRateWindow(createdById);

      const userSettings = await ctx.db.userSettings.findFirst({
        where: { userId: createdById },
      });
      if (!userSettings?.defaultHourCodeId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No default hour code found in user settings. Please add one to the user's permissions.",
        });
      }

      if (
        input.clockPIN.toUpperCase() !== userSettings.clockPIN?.toUpperCase()
      ) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Incorrect Clock PIN",
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
      await inRateWindow(ctx.userId);

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
      const users = await clerkClient.users.getUserList();
      const settings = await ctx.db.userSettings.findMany({
        where: { userId: { in: users.map((u) => u.id) } },
      });
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
      return groupedResult;
    }),
});
