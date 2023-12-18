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
import { filterUserForClient } from "../helpers/filterUsersForClient";

// Create a new ratelimiter, that allows 3 req per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const itemsRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z
        .object({
          category: z.enum(["concession", "admission"]).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
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

  getById: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
        label: z.string().min(1).max(20, "Too many characters"),
        sellingPrice: z.number().min(25).max(1500),
        purchasePrice: z.number().min(25).max(1500),
        inStock: z.number().min(0).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

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
        label: z.string().min(1).max(20, "Too many characters"),
        sellingPrice: z.number().min(100).max(20000),
        isSeasonal: z.boolean(),
        isDay: z.boolean(),
        patronLimit: z.number().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

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
        label: z.string().min(1).max(20, "Too many characters").optional(),
        sellingPrice: z.number().min(25).max(1500).optional(),
        purchasePrice: z.number().min(25).max(1500).optional(),
        inStock: z.number().min(0).max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
        sellingPrice: z.number().min(25).max(20000).optional(),
        isSeasonal: z.boolean().optional(),
        isDay: z.boolean().optional(),
        patronLimit: z.number().min(1).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: { ...input },
      });
      return item;
    }),
});
