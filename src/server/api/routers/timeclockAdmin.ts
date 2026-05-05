import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, orgAdminProcedure } from "~/server/api/trpc";

export const timeclockAdminRouter = createTRPCRouter({
  getTimeclockEvents: orgAdminProcedure
    .input(
      z.object({ range: z.tuple([z.date(), z.date()]), userId: z.string() }),
    )
    .query(async ({ input, ctx }) => {
      const tces = await ctx.db.timeClockEvent.findMany({
        where: {
          organizationId: ctx.organizationId,
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

  upsertTimeclockEvent: orgAdminProcedure
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
        // For updates, verify the event belongs to the org
        if (input.eventId) {
          const existing = await ctx.db.timeClockEvent.findFirst({
            where: { id: input.eventId, organizationId: ctx.organizationId },
          });
          if (!existing) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
          }
        }

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
            organizationId: ctx.organizationId,
          },
        });
        return upsertedEvent;
      } catch (error) {
        console.error("Error upserting timeclock event:", error);
        throw error;
      }
    }),

  deleteTimeclockEvent: orgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify event belongs to org
      const existing = await ctx.db.timeClockEvent.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

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
