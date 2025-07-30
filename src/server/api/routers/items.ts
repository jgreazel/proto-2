import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  publicProcedure,
  privateProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";

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
      // await inRateWindow(ctx.userId);
      let items = await ctx.db.inventoryItem.findMany({
        take: 100,
        orderBy: [{ createdAt: "desc" }],
      });

      if (input?.category) {
        items = items.filter((i) => {
          return (
            (i.isAdmissionItem && input?.category === "admission") ||
            (i.isConcessionItem && input?.category === "concession")
          );
        });
      }

      return items.map((i) => {
        return {
          item: i,
          // createdBy,
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
      // await inRateWindow(ctx.userId);

      const item = await ctx.db.inventoryItem.findUnique({
        where: { id: input.id },
      });

      if (item === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item doesn't exist",
        });
      }

      return {
        item,
      };
    }),

  createConcessionItem: privateProcedure
    .input(
      z.object({
        label: z.string().min(1).max(50, "Too many characters"),
        sellingPrice: z.number().min(SELL_MIN).max(SELL_MAX),
        purchasePrice: z.number().min(SELL_MIN).max(SELL_MAX),
        inStock: z.number().min(0).max(10000),
        category: z
          .string()
          .min(1)
          .max(50, "Category name too long")
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      // await inRateWindow(createdById);

      const item = await ctx.db.inventoryItem.create({
        data: {
          createdBy: createdById,
          label: input.label,
          sellingPrice: input.sellingPrice,
          isConcessionItem: true,
          purchasePrice: input.purchasePrice,
          inStock: input.inStock,
          category: input.category,
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
      // await inRateWindow(createdById);

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
        category: z
          .string()
          .min(1)
          .max(50, "Category name too long")
          .optional(),
        changeNote: z.string().max(750, "Note too long").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Get the current item to store old values
      const currentItem = await ctx.db.inventoryItem.findUnique({
        where: { id: input.id },
      });

      if (!currentItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Extract the update data (excluding changeNote)
      const { changeNote, ...updateData } = input;

      // Update the item
      const item = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: updateData,
      });

      // Create change log entry for concession item
      if (Object.keys(updateData).filter((key) => key !== "id").length > 0) {
        try {
          await ctx.db.itemChangeLog.create({
            data: {
              itemId: input.id,
              userId: ctx.userId,
              changeNote: changeNote ?? null,
              oldValues: {
                label: currentItem.label,
                sellingPrice: currentItem.sellingPrice,
                purchasePrice: currentItem.purchasePrice,
                inStock: currentItem.inStock,
              },
              newValues: {
                label: item.label,
                sellingPrice: item.sellingPrice,
                purchasePrice: item.purchasePrice,
                inStock: item.inStock,
              },
            },
          });
        } catch (error) {
          console.warn("Change log creation failed:", error);
        }
      }

      return item;
    }),

  deleteConcessionItem: privateProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.transactionItems.deleteMany({
        where: { itemId: input.id },
      });
      const deletedItem = await ctx.db.inventoryItem.delete({
        where: { id: input.id },
        include: { transactions: true },
      });

      return deletedItem;
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
        changeNote: z.string().max(750, "Note too long").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Get the current item to store old values
      const currentItem = await ctx.db.inventoryItem.findUnique({
        where: { id: input.id },
      });

      if (!currentItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      // Extract the update data (excluding changeNote)
      const { changeNote, ...updateData } = input;

      // Update the item
      const item = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: updateData,
      });

      // Create change log entry for admission item
      if (Object.keys(updateData).filter((key) => key !== "id").length > 0) {
        try {
          await ctx.db.itemChangeLog.create({
            data: {
              itemId: input.id,
              userId: ctx.userId,
              changeNote: changeNote ?? null,
              oldValues: {
                label: currentItem.label,
                sellingPrice: currentItem.sellingPrice,
                isSeasonal: currentItem.isSeasonal,
                isDay: currentItem.isDay,
                patronLimit: currentItem.patronLimit,
              },
              newValues: {
                label: item.label,
                sellingPrice: item.sellingPrice,
                isSeasonal: item.isSeasonal,
                isDay: item.isDay,
                patronLimit: item.patronLimit,
              },
            },
          });
        } catch (error) {
          console.warn("Change log creation failed:", error);
        }
      }

      return item;
    }),

  restockItems: privateProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            id: z.string(),
            restockAmount: z.number().min(-10000).max(10000),
          }),
        ),
        changeNote: z.string().max(500, "Note too long").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const items = await ctx.db.inventoryItem.findMany({
        where: { id: { in: input.items.map((i) => i.id) } },
      });

      // Update items and create change logs
      await Promise.all(
        items.map(async (item) => {
          const inputItem = input.items.find((i) => i.id === item.id);
          if (!inputItem) return;

          const oldStock = item.inStock!;
          const newStock = oldStock + inputItem.restockAmount;

          // Update the item
          await ctx.db.inventoryItem.update({
            where: { id: item.id },
            data: { inStock: newStock },
          });

          // Create change log entry
          try {
            await ctx.db.itemChangeLog.create({
              data: {
                itemId: item.id,
                userId: ctx.userId,
                changeNote:
                  input.changeNote ??
                  `Restocked: ${inputItem.restockAmount > 0 ? "+" : ""}${
                    inputItem.restockAmount
                  }`,
                oldValues: {
                  inStock: oldStock,
                },
                newValues: {
                  inStock: newStock,
                },
              },
            });
          } catch (error) {
            console.warn("Change log creation failed:", error);
          }
        }),
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
      // await inRateWindow(ctx.userId);

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
              message: "Please create a new Season Pass",
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

  // Sales history and void management endpoints
  getCompletedSales: privateProcedure
    .input(
      z
        .object({
          hoursBack: z.number().min(1).max(168).default(24), // 1 hour to 7 days, default 24 hours
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Calculate the cutoff time
      const hoursBack = input?.hoursBack ?? 24;
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      // Fetch transactions within the time window
      const transactions = await ctx.db.transaction.findMany({
        where: {
          createdAt: {
            gte: cutoffTime,
          },
        },
        include: {
          items: {
            include: {
              item: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transform the data to include calculated totals and only concession items
      const completedSales = transactions
        .map((transaction) => {
          // Filter only concession items from this transaction
          const concessionItems = transaction.items.filter(
            (transactionItem) => transactionItem.item.isConcessionItem,
          );

          // Skip transactions with no concession items
          if (concessionItems.length === 0) {
            return null;
          }

          // Calculate total for concession items only
          const total = concessionItems.reduce(
            (sum, transactionItem) =>
              sum +
              transactionItem.amountSold * transactionItem.item.sellingPrice,
            0,
          );

          return {
            id: transaction.id,
            createdAt: transaction.createdAt,
            createdBy: transaction.createdBy,
            total,
            itemCount: concessionItems.reduce(
              (sum, transactionItem) => sum + transactionItem.amountSold,
              0,
            ),
            items: concessionItems.map((transactionItem) => ({
              id: transactionItem.item.id,
              label: transactionItem.item.label,
              amountSold: transactionItem.amountSold,
              unitPrice: transactionItem.item.sellingPrice,
              lineTotal:
                transactionItem.amountSold * transactionItem.item.sellingPrice,
              category: transactionItem.item.category,
            })),
          };
        })
        .filter((sale) => sale !== null);

      return completedSales;
    }),

  // Category management endpoints
  getCategories: privateProcedure.query(async ({ ctx }) => {
    // Get categories from both the dedicated Category table and existing items
    const [dedicatedCategories, itemCategories] = await Promise.all([
      ctx.db.category.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      ctx.db.inventoryItem.findMany({
        where: {
          isConcessionItem: true,
          category: { not: null },
        },
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    // Combine both sources and remove duplicates
    const allCategories = new Set([
      ...dedicatedCategories.map((cat) => cat.name),
      ...itemCategories
        .map((item) => item.category)
        .filter((category): category is string => category !== null),
    ]);

    return Array.from(allCategories).sort();
  }),

  createCategory: privateProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50, "Category name too long"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if category already exists
      const existingCategory = await ctx.db.category.findUnique({
        where: { name: input.name },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category already exists",
        });
      }

      // Create the new category
      const category = await ctx.db.category.create({
        data: {
          name: input.name,
          createdBy: ctx.userId,
        },
      });

      return category;
    }),

  updateItemCategory: privateProcedure
    .input(
      z.object({
        itemId: z.string(),
        category: z
          .string()
          .min(1)
          .max(50, "Category name too long")
          .optional(),
        changeNote: z.string().max(750, "Note too long").optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the current item to store old values
      const currentItem = await ctx.db.inventoryItem.findUnique({
        where: { id: input.itemId },
      });

      if (!currentItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Item not found",
        });
      }

      if (!currentItem.isConcessionItem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only concession items can have categories",
        });
      }

      // Update the item
      const item = await ctx.db.inventoryItem.update({
        where: { id: input.itemId },
        data: { category: input.category },
      });

      // Create change log entry
      try {
        await ctx.db.itemChangeLog.create({
          data: {
            itemId: input.itemId,
            userId: ctx.userId,
            changeNote: input.changeNote ?? "Category updated",
            oldValues: {
              category: currentItem.category,
            },
            newValues: {
              category: input.category,
            },
          },
        });
      } catch (error) {
        console.warn("Change log creation failed:", error);
      }

      return item;
    }),
});
