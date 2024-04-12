import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const [user] = await clerkClient.users.getUserList({
        username: [input.username],
      });
      if (!user)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      return filterUserForClient(user);
    }),

  leaveFeedback: privateProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.db.feedback.create({
        data: { message: input.message, createdBy: ctx.userId },
      });
      if (!msg) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Feedback not recorded",
        });
      }
      return msg;
    }),

  getUsers: privateProcedure.query(async ({ ctx }) => {
    const createdById = ctx.userId;
    const { success } = await ratelimit.limit(createdById);
    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

    const users = await clerkClient.users.getUserList();
    const userSettings = await ctx.db.userSettings.findMany({
      where: { userId: { in: users.map((u) => u.id) } },
    });
    const result = users.map((u) => {
      const user = filterUserForClient(u);
      const s = userSettings.find((x) => x.userId === u.id);
      return {
        ...user,
        settings: s,
      };
    });
    return result;
  }),

  createUser: privateProcedure
    .input(
      z.object({
        username: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        password: z.string().min(8),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      const { success } = await ratelimit.limit(createdById);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const user = await clerkClient.users.createUser({
        username: input.username,
        password: input.password,
        firstName: input.firstname,
        lastName: input.lastname,
        ...(!!input.email && { email: input.email }),
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Feedback not recorded",
        });
      }
      return user;
    }),

  createSettings: privateProcedure
    .input(
      z.object({
        userId: z.string(),
        defaultHourCodeId: z.string(),
        canModifyHourCode: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.userSettings.create({
        data: {
          userId: input.userId,
          createdBy: ctx.userId,
          canModifyHourCode: input.canModifyHourCode,
          defaultHourCode: { connect: { id: input.defaultHourCodeId } },
        },
      });
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failure to create record",
        });
      }
      return result;
    }),

  updateSettings: privateProcedure
    .input(z.object({ userId: z.string(), defaultHourCodeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.userSettings.update({
        where: { userId: input.userId },
        data: {
          defaultHourCode: { connect: { id: input.defaultHourCodeId } },
        },
      });
      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failure to update record",
        });
      }
      return result;
    }),
});
