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

  updateTimeclockEvent: privateProcedure
    .input(
      z.object({
        eventId: z.string(),
        hourCodeId: z.string(),
        time: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const updatedEvent = await ctx.db.timeClockEvent.update({
          where: { id: input.eventId },
          data: {
            hourCodeId: input.hourCodeId,
            createdAt: input.time,
          },
        });
        return updatedEvent;
      } catch (error) {
        console.error("Error updating timeclock event:", error);
        throw error;
      }
    }),
});
