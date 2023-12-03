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
  getAll: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.concessionItem.findMany({
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

  create: privateProcedure
    .input(
      z.object({
        label: z.string().min(1).max(20, "Too many characters"),
        // sellingPrice: z.number().min(25).max(1500),
        // purchasePrice: z.number().min(25).max(1500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const item = await ctx.db.concessionItem.create({
        data: {
          createdBy: createdById,
          label: input.label,
          // sellingPrice: input.sellingPrice,
          // purchasePrice: input.purchasePrice,
        },
      });
      return item;
    }),
});
