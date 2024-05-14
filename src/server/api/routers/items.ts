import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
import inRateWindow from "../helpers/inRateWindow";

const SELL_MIN = 0;
// $500.00
const SELL_MAX = 50000;

export const itemsRouter = createTRPCRouter({
  getAll: privateProcedure
    .input(
      z
        .object({
          category: z.enum(["concession", "admission"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);
      let items = await ctx.db.inventoryItem.findMany({
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      // likely remove later
      // just example of intermediate request for supplementary data
      // if need ALL req to have user data, middleware might be better place
      const users = await clerkClient.users
        .getUserList({
          userId: items.map((i) => i.createdBy),
          limit: 100,
        })
        .then((res) => res.filter(filterUserForClient));

      if (input?.category) {
        items = items.filter((i) => {
          return (
            (i.isAdmissionItem && input?.category === "admission") ||
            (i.isConcessionItem && input?.category === "concession")
          );
        });
      }

      return items.map((i) => {
        const createdBy = users.find((u) => u.id === i.createdBy);
        if (!createdBy)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User data not found",
          });

        return {
          item: i,
          createdBy,
        };
      });
    }),

  getById: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

      const item = await ctx.db.inventoryItem.findUnique({
        where: { id: input.id },
      });

      if (item === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item doesn't exist",
        });
      }

      // likely remove later
      // just example of intermediate request for supplementary data
      // if need ALL req to have user data, middleware might be better place
      const user = await clerkClient.users
        .getUser(item.createdBy)
        .then((res) => filterUserForClient(res));

      return {
        item,
        createdBy: user,
      };
    }),

  createConcessionItem: privateProcedure
    .input(
      z.object({
        label: z.string().min(1).max(50, "Too many characters"),
        sellingPrice: z.number().min(SELL_MIN).max(SELL_MAX),
        purchasePrice: z.number().min(SELL_MIN).max(SELL_MAX),
        inStock: z.number().min(0).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      await inRateWindow(createdById);

      const item = await ctx.db.inventoryItem.create({
        data: {
          createdBy: createdById,
          label: input.label,
          sellingPrice: input.sellingPrice,
          isConcessionItem: true,
          purchasePrice: input.purchasePrice,
          inStock: input.inStock,
        },
      });
      return item;
    }),

  createAdmissionItem: privateProcedure
    .input(
      z.object({
        label: z.string().min(1).max(50, "Too many characters"),
        sellingPrice: z.number().min(SELL_MIN).max(SELL_MAX),
        isSeasonal: z.boolean(),
        isDay: z.boolean(),
        patronLimit: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      await inRateWindow(createdById);

      const item = await ctx.db.inventoryItem.create({
        data: {
          createdBy: createdById,
          label: input.label,
          sellingPrice: input.sellingPrice,
          isAdmissionItem: true,
          isSeasonal: input.isSeasonal,
          isDay: input.isDay,
          patronLimit: input.patronLimit,
        },
      });
      return item;
    }),

  updateConcessionItem: privateProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(50, "Too many characters").optional(),
        sellingPrice: z.number().min(SELL_MIN).max(SELL_MAX).optional(),
        purchasePrice: z.number().min(SELL_MIN).max(SELL_MAX).optional(),
        inStock: z.number().min(0).max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

      const item = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: { ...input },
      });
      return item;
    }),

  updateAdmissionItem: privateProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(20, "Too many characters").optional(),
        sellingPrice: z.number().min(SELL_MIN).max(SELL_MAX).optional(),
        isSeasonal: z.boolean().optional(),
        isDay: z.boolean().optional(),
        patronLimit: z.number().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

      const item = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: { ...input },
      });
      return item;
    }),

  restockItems: privateProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          restockAmount: z.number().min(1).max(200),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

      const items = await ctx.db.inventoryItem.findMany({
        where: { id: { in: input.map((i) => i.id) } },
      });

      await Promise.all(
        items.map(
          async (i, idx) =>
            await ctx.db.inventoryItem.update({
              where: { id: i.id },
              data: { ...i, inStock: i.inStock! + input[idx]!.restockAmount },
            }),
        ),
      ).catch((e: { message: string }) => {
        throw new TRPCError({ message: e.message, code: "BAD_REQUEST" });
      });
      return { message: "Inventory successfully updated!", success: true };
    }),

  checkout: privateProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          amountSold: z.number().min(1).max(200),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

      const items = await ctx.db.inventoryItem.findMany({
        where: { id: { in: input.map((i) => i.id) } },
      });
      const includedSeasonPass = items.some((i) => i.isSeasonal);

      if (items.length !== input.length) {
        throw new TRPCError({
          message: "Simplify your request..",
          code: "BAD_REQUEST",
        });
      }

      // Decrease stock of items as needed
      const concessionItemsToUpdate = items.filter((i) => i.isConcessionItem);
      await Promise.all(
        concessionItemsToUpdate.map(
          async (i) =>
            await ctx.db.inventoryItem.update({
              where: { id: i.id },
              data: {
                ...i,
                inStock:
                  i.inStock! -
                  (input.find((x) => x.id == i.id)?.amountSold ?? 0),
              },
            }),
        ),
      ).catch((e: { message: string }) => {
        throw new TRPCError({ message: e.message, code: "BAD_REQUEST" });
      });

      const transaction = await ctx.db.transaction.create({
        data: {
          createdBy: ctx.userId,
          items: {
            createMany: {
              data: input.map((i) => ({
                itemId: i.id,
                createdBy: ctx.userId,
                amountSold: i.amountSold,
              })),
            },
          },
        },
        include: { items: { select: { item: true, amountSold: true } } },
      });

      let total = 0;

      const receiptItems = transaction.items.map((i) => {
        const lineTotal = i.amountSold * i.item.sellingPrice;
        total += lineTotal;

        return {
          id: i.item.id,
          label: i.item.label,
          amountSold: i.amountSold,
          total: lineTotal,
        };
      });

      return {
        message: "Transaction successful!",
        total,
        action: includedSeasonPass
          ? {
              message: "Add new pass to the Passes tab?",
              href: "/passes/0",
            }
          : null,
        success: true,
        receipt: {
          ...transaction,
          items: receiptItems,
        },
      };
    }),
});
