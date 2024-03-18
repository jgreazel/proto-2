import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
});

export const schedulesRouter = createTRPCRouter({
  getShifts: privateProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        dateRange: z.tuple([z.date(), z.date()]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

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
});
