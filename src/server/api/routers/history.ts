import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";
import type { PrismaClient } from "@prisma/client";

// Types for unified transaction history
type TransactionType = "purchase" | "admission";

interface BaseHistoryItem {
  id: string;
  type: TransactionType;
  createdAt: Date;
  createdBy: string;
  isVoided: boolean;
  voidedAt: Date | null;
  voidedBy: string | null;
  voidReason: string | null;
}

interface PurchaseHistoryItem extends BaseHistoryItem {
  type: "purchase";
  total: number;
  itemCount: number;
  items: Array<{
    id: string;
    label: string;
    amountSold: number;
    unitPrice: number;
    lineTotal: number;
    category: string | null;
  }>;
}

interface AdmissionHistoryItem extends BaseHistoryItem {
  type: "admission";
  patronName: string;
  passLabel: string;
}

type HistoryItem = PurchaseHistoryItem | AdmissionHistoryItem;

// Composable functions for fetching different types of history data

/**
 * Fetch purchase transactions within a time window
 */
async function getPurchaseHistory(
  db: PrismaClient,
  cutoffTime: Date,
): Promise<PurchaseHistoryItem[]> {
  const transactions = await db.transaction.findMany({
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

  return transactions
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
          sum + transactionItem.amountSold * transactionItem.item.sellingPrice,
        0,
      );

      return {
        id: transaction.id,
        type: "purchase" as const,
        createdAt: transaction.createdAt,
        createdBy: transaction.createdBy,
        isVoided: transaction.isVoided,
        voidedAt: transaction.voidedAt,
        voidedBy: transaction.voidedBy,
        voidReason: transaction.voidReason,
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
    .filter((purchase): purchase is PurchaseHistoryItem => purchase !== null);
}

/**
 * Fetch admission events within a time window
 */
async function getAdmissionHistory(
  db: PrismaClient,
  cutoffTime: Date,
): Promise<AdmissionHistoryItem[]> {
  const admissions = await db.admissionEvent.findMany({
    where: {
      createdAt: {
        gte: cutoffTime,
      },
    },
    include: {
      patron: {
        include: {
          pass: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return admissions.map((admission) => ({
    id: admission.id,
    type: "admission" as const,
    createdAt: admission.createdAt,
    createdBy: admission.createdBy,
    isVoided: admission.isVoided ?? false,
    voidedAt: admission.voidedAt ?? null,
    voidedBy: admission.voidedBy ?? null,
    voidReason: admission.voidReason ?? null,
    patronName: `${admission.patron.firstName} ${admission.patron.lastName}`,
    passLabel: admission.patron.pass.label,
  }));
}

/**
 * Void a purchase transaction
 */
async function voidPurchaseTransaction(
  db: PrismaClient,
  transactionId: string,
  voidReason: string,
  userId: string,
): Promise<{ refundAmount: number }> {
  // First, get the transaction with its items
  const transaction = await db.transaction.findUnique({
    where: { id: transactionId },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!transaction) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Transaction not found",
    });
  }

  if (transaction.isVoided) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Transaction is already voided",
    });
  }

  // Only void transactions with concession items
  const concessionItems = transaction.items.filter(
    (transactionItem) => transactionItem.item.isConcessionItem,
  );

  if (concessionItems.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot void transactions without concession items",
    });
  }

  // Use a transaction to ensure all operations succeed or fail together
  const result = await db.$transaction(async (prisma) => {
    // Restore inventory for concession items
    for (const transactionItem of concessionItems) {
      await prisma.inventoryItem.update({
        where: { id: transactionItem.itemId },
        data: {
          inStock: {
            increment: transactionItem.amountSold,
          },
        },
      });
    }

    // Mark the transaction as voided
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: voidReason,
      },
    });

    // Calculate refund amount
    const refundAmount = concessionItems.reduce(
      (sum, transactionItem) =>
        sum + transactionItem.amountSold * transactionItem.item.sellingPrice,
      0,
    );

    return { refundAmount };
  });

  return result;
}

/**
 * Void an admission event
 */
async function voidAdmissionEvent(
  db: PrismaClient,
  admissionId: string,
  voidReason: string,
  userId: string,
): Promise<void> {
  const admission = await db.admissionEvent.findUnique({
    where: { id: admissionId },
  });

  if (!admission) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Admission event not found",
    });
  }

  if (admission.isVoided ?? false) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Admission is already voided",
    });
  }

  await db.admissionEvent.update({
    where: { id: admissionId },
    data: {
      isVoided: true,
      voidedAt: new Date(),
      voidedBy: userId,
      voidReason: voidReason,
    },
  });
}

// TRPC Router
export const historyRouter = createTRPCRouter({
  /**
   * Get unified transaction history including both purchases and admissions
   */
  getAll: privateProcedure
    .input(
      z
        .object({
          hoursBack: z.number().min(1).max(168).default(24), // 1 hour to 7 days, default 24 hours
          includeVoided: z.boolean().default(false), // Toggle to show voided items
          type: z.enum(["all", "purchases", "admissions"]).default("all"), // Filter by type
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const hoursBack = input?.hoursBack ?? 24;
      const includeVoided = input?.includeVoided ?? false;
      const type = input?.type ?? "all";

      // Calculate the cutoff time
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

      let historyItems: HistoryItem[] = [];

      // Fetch purchases if requested
      if (type === "all" || type === "purchases") {
        const purchases = await getPurchaseHistory(ctx.db, cutoffTime);
        historyItems.push(...purchases);
      }

      // Fetch admissions if requested
      if (type === "all" || type === "admissions") {
        const admissions = await getAdmissionHistory(ctx.db, cutoffTime);
        historyItems.push(...admissions);
      }

      // Filter out voided items if not requested
      if (!includeVoided) {
        historyItems = historyItems.filter((item) => !item.isVoided);
      }

      // Sort by creation date (newest first)
      historyItems.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );

      return historyItems;
    }),

  /**
   * Void a transaction (purchase or admission)
   */
  voidTransaction: privateProcedure
    .input(
      z.object({
        id: z.string(),
        type: z.enum(["purchase", "admission"]),
        voidReason: z
          .string()
          .min(1, "Void reason is required")
          .max(500, "Reason too long"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "purchase") {
        return await voidPurchaseTransaction(
          ctx.db,
          input.id,
          input.voidReason,
          ctx.userId,
        );
      } else {
        await voidAdmissionEvent(
          ctx.db,
          input.id,
          input.voidReason,
          ctx.userId,
        );
        return { refundAmount: 0 }; // No refund for admissions
      }
    }),
});
