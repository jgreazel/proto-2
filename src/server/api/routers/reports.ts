import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import { filterUserForClient } from "../helpers/filterUsersForClient";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

export const reportsRouter = createTRPCRouter({
  getNew: privateProcedure
    .input(
      z.object({
        purchaseReport: z.object({
          startDate: z.date(),
          endDate: z.date(),
          includeAdmissions: z.boolean().default(false).optional(),
          includeConcessions: z.boolean().default(false).optional(),
        }),
        // todo
        admissionReport: z.object({}).optional().nullable(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const tranItemLinks = await ctx.db.transactionItems
        .findMany({
          where: {
            createdAt: {
              gte: input.purchaseReport.startDate,
              lte: input.purchaseReport.endDate,
            },
          },
          include: {
            item: true,
          },
        })
        .then((dbLinks) =>
          dbLinks.filter((l) => {
            if (l.item.isAdmissionItem) {
              return input.purchaseReport.includeAdmissions;
            } else if (l.item.isConcessionItem) {
              return input.purchaseReport.includeConcessions;
            }
          }),
        );

      const users = await clerkClient.users
        .getUserList({ userId: tranItemLinks.map((l) => l.createdBy) })
        .then((res) => res.filter(filterUserForClient));

      let admissionTotal = 0;
      let concessionTotal = 0;
      let admissionCount = 0;
      let concessionCount = 0;
      tranItemLinks.forEach((l) => {
        if (l.item.isAdmissionItem) {
          admissionTotal += l.amountSold * l.item.sellingPrice;
          admissionCount += l.amountSold;
        } else if (l.item.isConcessionItem) {
          concessionTotal += l.amountSold * l.item.sellingPrice;
          concessionCount += l.amountSold;
        }
        // Warning: improper use of field
        l.createdBy =
          users.find((u) => u.id === l.createdBy)?.username ?? l.createdBy;
      });

      return {
        purchaseReport: {
          startDate: input.purchaseReport.startDate,
          endDate: input.purchaseReport.endDate,
          transactions: tranItemLinks,
          summary: {
            admissionTotal,
            admissionCount,
            concessionTotal,
            concessionCount,
          },
        },
      };
    }),
});
