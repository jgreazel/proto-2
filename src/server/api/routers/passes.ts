import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
} from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

const addOneYear = (date: Date) => {
  const dateCopy = new Date(date);
  dateCopy.setFullYear(dateCopy.getFullYear() + 1);
  return dateCopy;
};

// Create a new ratelimiter, that allows 3 req per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const passesRouter = createTRPCRouter({
  getAll: publicProcedure.query(
    async ({ ctx }) =>
      await ctx.db.seasonPass.findMany({
        take: 100,
        orderBy: [{ label: "asc" }],
        include: { patrons: true },
      }),
  ),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const pass = await ctx.db.seasonPass.findUnique({
        where: { id: input.id },
        include: { patrons: true },
      });

      if (pass === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season Pass doesn't exist",
        });
      }

      return pass;
    }),

  createSeasonPass: privateProcedure
    .input(
      z.object({
        seasonPass: z.object({
          label: z.string().min(1).max(30, "Too many characters"),
          effectiveStartDate: z.date().optional(),
        }),
        patrons: z
          .array(
            z.object({
              firstName: z.string().min(1).max(50),
              lastName: z.string().min(1).max(50),
              birthDate: z.date().optional().nullable(),
              banReEntryDate: z.date().optional().nullable(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const pass = await ctx.db.seasonPass.create({
        data: {
          ...input.seasonPass,
          createdBy: createdById,
          effectiveEndDate: addOneYear(
            input.seasonPass.effectiveStartDate ?? new Date(),
          ),
          ...(input.patrons && {
            patrons: {
              createMany: {
                data: input.patrons.map((p) => ({
                  ...p,
                  createdBy: createdById,
                })),
              },
            },
          }),
        },
        include: { patrons: true },
      });
      if (!pass)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create season pass object",
        });

      return pass;
    }),

  updateSeasonPass: privateProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(30, "Too many characters").optional(),
        effectiveStartDate: z.date().optional(),
        effectiveEndDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pass = await ctx.db.seasonPass.update({
        where: { id: input.id },
        data: { ...input },
      });
      return pass;
    }),

  getPatronById: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const patron = await ctx.db.patron.findUnique({
        where: { id: input.id },
      });

      if (patron === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Patron doesn't exist",
        });
      }

      return patron;
    }),

  createPatron: privateProcedure
    .input(
      z.object({
        passId: z.string(),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        birthDate: z.date().nullable().optional(),
        banReEntryDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdBy = ctx.userId;

      const patron = await ctx.db.patron.create({
        data: { ...input, createdBy },
      });
      return patron;
    }),

  updatePatron: privateProcedure
    .input(
      z.object({
        id: z.string(),
        passId: z.string().optional(),
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        birthDate: z.date().optional().nullable(),
        banReEntryDate: z.date().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patron = await ctx.db.patron.update({
        where: { id: input.id },
        data: { ...input },
      });
      return patron;
    }),
});
