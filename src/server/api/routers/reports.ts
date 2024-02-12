import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import { filterUserForClient } from "../helpers/filterUsersForClient";

// Create a new ratelimiter, that allows 3 req per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

// todo: concession item checkouts arent getting reported as transactions
export const reportsRouter = createTRPCRouter({
  // Just for purchase report, edit later to add admission reports
  getNew: privateProcedure
    .input(
      z.object({
        purchaseReport: z.object({
          startDate: z.date(),
          endDate: z.date(),
          includeAdmissions: z.boolean().default(false).optional(),
          includeConcessions: z.boolean().default(false).optional(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const tranItemLinks = await ctx.db.transactionItems.findMany({
        where: {
          createdAt: {
            gte: input.purchaseReport.startDate,
            lte: input.purchaseReport.endDate,
          },
        },
        include: {
          item: true,
        },
      });

      const filteredLinks = tranItemLinks.filter(
        (l) =>
          (l.item.isAdmissionItem && input.purchaseReport.includeAdmissions) ??
          (l.item.isConcessionItem && input.purchaseReport.includeConcessions),
      );
      const users = await clerkClient.users
        .getUserList({ userId: filteredLinks.map((l) => l.createdBy) })
        .then((res) => res.filter(filterUserForClient));

      let admissionTotal = 0;
      let concessionTotal = 0;
      filteredLinks.forEach((l) => {
        if (l.item.isAdmissionItem) {
          admissionTotal += l.amountSold * l.item.sellingPrice;
        } else if (l.item.isConcessionItem) {
          concessionTotal += l.amountSold * l.item.sellingPrice;
        }
        // Warning: improper use of field
        l.createdBy =
          users.find((u) => u.id === l.createdBy)?.username ?? l.createdBy;
      });

      return {
        purchaseReport: {
          startDate: input.purchaseReport.startDate,
          endDate: input.purchaseReport.endDate,
          transactions: filteredLinks,
          summary: {
            admissionTotal,
            concessionTotal,
          },
        },
      };
    }),
});
