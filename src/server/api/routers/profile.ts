import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashSync } from "bcrypt-ts";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
import inRateWindow from "../helpers/inRateWindow";

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
    await inRateWindow(ctx.userId);

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
        firstName: z.string(),
        lastName: z.string(),
        password: z.string().min(8),
        email: z.string().email().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);

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
        return user;
      } catch (e) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: (e as Error).message,
        });
      }
    }),

  createSettings: privateProcedure
    .input(
      z.object({
        userId: z.string(),
        defaultHourCodeId: z.string(),
        canModifyHourCode: z.boolean(),
        clockPIN: z.string().length(4),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);
      const result = await ctx.db.userSettings.create({
        data: {
          userId: input.userId,
          createdBy: ctx.userId,
          canModifyHourCode: input.canModifyHourCode,
          defaultHourCode: { connect: { id: input.defaultHourCodeId } },
          clockPIN: input.clockPIN,
          isAdmin: input.isAdmin,
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
    .input(
      z.object({
        userId: z.string(),
        defaultHourCodeId: z.string(),
        canModifyHourCode: z.boolean(),
        clockPIN: z.string().length(4),
        isAdmin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await inRateWindow(ctx.userId);
      const result = await ctx.db.userSettings.update({
        where: { userId: input.userId },
        data: {
          canModifyHourCode: input.canModifyHourCode,
          clockPIN: input.clockPIN,
          defaultHourCode: { connect: { id: input.defaultHourCodeId } },
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
      await inRateWindow(ctx.userId);

      const setting = await ctx.db.userSettings.findFirst({
        where: { userId: input?.userId ?? ctx.userId },
      });
      return setting ?? undefined;
    }),
});
