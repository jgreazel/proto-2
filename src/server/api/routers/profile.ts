import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { hashSync } from "bcrypt-ts";

import {
  createTRPCRouter,
  orgAdminProcedure,
  orgProcedure,
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

  leaveFeedback: orgProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const msg = await ctx.db.feedback.create({
        data: {
          message: input.message,
          createdBy: ctx.userId,
          organizationId: ctx.organizationId,
        },
      });
      if (!msg) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Feedback not recorded",
        });
      }
      return msg;
    }),

  getUsers: orgAdminProcedure.query(async ({ ctx }) => {
    // Get org members instead of global Clerk user list
    const memberships = await ctx.db.organizationMembership.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "asc" },
    });

    // For Clerk-linked members, fetch their Clerk profiles
    const clerkUserIds = memberships
      .filter((m) => m.userId !== null)
      .map((m) => m.userId!);

    const clerkUsers =
      clerkUserIds.length > 0
        ? await clerkClient.users
            .getUserList({ userId: clerkUserIds, limit: 500 })
            .then((res) => res.map(filterUserForClient))
        : [];

    // Also get legacy UserSettings for backwards compat
    const userSettings = await ctx.db.userSettings.findMany({
      where: { userId: { in: clerkUserIds } },
    });

    return memberships.map((m) => {
      const clerkUser = clerkUsers.find((u) => u.id === m.userId);
      const settings = userSettings.find((s) => s.userId === m.userId);
      return {
        id: clerkUser?.id ?? m.id,
        username: clerkUser?.username ?? m.displayName,
        firstName: clerkUser?.firstName ?? m.displayName.split(" ")[0] ?? null,
        lastName: clerkUser?.lastName ?? m.displayName.split(" ").slice(1).join(" ") ?? null,
        imageUrl: clerkUser?.imageUrl ?? null,
        membership: m,
        settings,
      };
    });
  }),

  createUser: orgAdminProcedure
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

        // Create org membership for the new user
        await ctx.db.organizationMembership.create({
          data: {
            organizationId: ctx.organizationId,
            userId: user.id,
            displayName: `${input.firstName} ${input.lastName}`,
            isAdmin: input.isAdmin,
            role: input.isAdmin ? "admin" : "staff",
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

  updateSettings: orgAdminProcedure
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

      // Also update the org membership
      const membership = await ctx.db.organizationMembership.findFirst({
        where: {
          organizationId: ctx.organizationId,
          userId: input.userId,
        },
      });
      if (membership) {
        await ctx.db.organizationMembership.update({
          where: { id: membership.id },
          data: {
            isAdmin: input.isAdmin,
            role: input.isAdmin ? "admin" : "staff",
          },
        });
      }

      return result;
    }),

  getSettingsByUser: orgProcedure
    .input(z.object({ userId: z.string() }).optional())
    .query(async ({ ctx, input }) => {
      const setting = await ctx.db.userSettings.findFirst({
        where: { userId: input?.userId ?? ctx.userId },
      });
      return setting ?? undefined;
    }),

  deleteUser: orgAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot delete your own account",
        });
      }

      try {
        // Remove org membership
        const membership = await ctx.db.organizationMembership.findFirst({
          where: {
            organizationId: ctx.organizationId,
            userId: input.userId,
          },
        });
        if (membership) {
          await ctx.db.organizationMembership.delete({
            where: { id: membership.id },
          });
        }

        // Remove settings from our DB
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
