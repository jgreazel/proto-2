import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

export const timeclockAdminRouter = createTRPCRouter({
  getTimeclockEvents: privateProcedure
    .input(
      z.object({ range: z.tuple([z.date(), z.date()]), userId: z.string() }),
    )
    .query(async ({ input, ctx }) => {
      const tces = await ctx.db.timeClockEvent.findMany({
        where: {
          createdAt: {
            gte: input.range[0],
            lte: input.range[1],
          },
          userId: input.userId,
        },
        include: { hourCode: true },
      });
      if (!tces) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to fetch time punches",
        });
      }
      return tces;
    }),

  upsertTimeclockEvent: privateProcedure
    .input(
      z.object({
        eventId: z.string().optional(),
        hourCodeId: z.string(),
        time: z.date(),
        userId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const upsertedEvent = await ctx.db.timeClockEvent.upsert({
          where: { id: input.eventId ?? "" },
          update: {
            hourCodeId: input.hourCodeId,
            createdAt: input.time,
          },
          create: {
            hourCodeId: input.hourCodeId,
            createdAt: input.time,
            createdBy: ctx.userId,
            userId: input.userId ?? "undefined",
          },
        });
        return upsertedEvent;
      } catch (error) {
        console.error("Error upserting timeclock event:", error);
        throw error;
      }
    }),

  deleteTimeclockEvent: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.timeClockEvent.delete({
        where: { id: input.id },
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete time clock event",
        });
      }
      return result;
    }),
});
