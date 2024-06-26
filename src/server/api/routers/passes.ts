import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
// import inRateWindow from "../helpers/inRateWindow";

const addOneYear = (date: Date) => {
  const dateCopy = new Date(date);
  dateCopy.setFullYear(dateCopy.getFullYear() + 1);
  return dateCopy;
};

// todo add effective dates
// should account for effective dates
export const passesRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    // await inRateWindow(ctx.userId);
    return await ctx.db.seasonPass.findMany({
      orderBy: [{ label: "asc" }],
      include: { patrons: true },
    });
  }),

  getById: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);
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
              // todo: banReEntryDate: z.date().optional().nullable(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      // await inRateWindow(createdById);

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
                  firstName: p.firstName,
                  lastName: p.lastName,
                  birthDate: p.birthDate,
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
      // await inRateWindow(ctx.userId);
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
      // await inRateWindow(ctx.userId);
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
      // await inRateWindow(createdBy);

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
      // await inRateWindow(ctx.userId);
      const patron = await ctx.db.patron.update({
        where: { id: input.id },
        data: { ...input },
      });
      return patron;
    }),

  admitPatron: privateProcedure
    .input(
      z.object({
        patronId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const admission = await ctx.db.admissionEvent.create({
        data: {
          patronId: input.patronId, // ? make sure patron is populated
          createdBy: ctx.userId,
        },
        include: {
          patron: true,
        },
      });
      return admission;
    }),

  getAdmissions: privateProcedure
    .input(
      z.object({
        range: z.array(z.date()).refine((data) => data.length === 2),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      return await ctx.db.admissionEvent.findMany({
        where: {
          createdAt: {
            lte: input.range[1],
            gte: input.range[0],
          },
        },
      });
    }),
});
