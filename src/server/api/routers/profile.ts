import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";

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

  getAllUsers: privateProcedure.query(async () => {
    const users = await clerkClient.users.getUserList();
    return users.filter(filterUserForClient);
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
});
