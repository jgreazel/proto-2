import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashSync } from "bcrypt-ts";

import {
  createTRPCRouter,
  adminProcedure,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";

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

  getUsers: adminProcedure.query(async ({ ctx }) => {
    // await inRateWindow(ctx.userId);

    const users = await clerkClient.users.getUserList({ limit: 500 });
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

  createUser: adminProcedure
    .input(
      z.object({
        username: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        password: z.string().min(8),
        email: z.string().email().nullable().optional(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const hashPw = hashSync(input.password, 10);
        const toAdd = {
          username: input.username,
          passwordDigest: hashPw,
          passwordHasher: "bcrypt",
          firstName: input.firstName,
          lastName: input.lastName,
          ...(!!input.email && { emailAddress: [input.email] }),
        };
        const user = await clerkClient.users.createUser(toAdd);
        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User not created",
          });
        }

        await ctx.db.userSettings.create({
          data: {
            userId: user.id,
            createdBy: ctx.userId,
            isAdmin: input.isAdmin,
          },
        });

        return user;
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (e as Error).message,
        });
      }
    }),

  updateSettings: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.userSettings.update({
        where: { userId: input.userId },
        data: {
          isAdmin: input.isAdmin,
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

  getSettingsByUser: privateProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const setting = await ctx.db.userSettings.findFirst({
        where: { userId: input?.userId ?? ctx.userId },
      });
      return setting ?? undefined;
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      try {
        // Remove settings from our DB first
        await ctx.db.userSettings.deleteMany({
          where: { userId: input.userId },
        });

        // Then delete from Clerk
        await clerkClient.users.deleteUser(input.userId);

        return { success: true };
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (e as Error).message,
        });
      }
    }),
});
