import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  orgProcedure,
  orgAdminProcedure,
  orgOwnerProcedure,
} from "~/server/api/trpc";

export const organizationRouter = createTRPCRouter({
  // ─── Read ─────────────────────────────────────────────

  getMyOrg: orgProcedure.query(async ({ ctx }) => {
    const org = await ctx.db.organization.findUnique({
      where: { id: ctx.organizationId },
    });
    if (!org) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
    }
    return {
      ...org,
      myRole: ctx.membership.role,
      myMembershipId: ctx.membershipId,
    };
  }),

  getMembers: orgAdminProcedure.query(async ({ ctx }) => {
    return ctx.db.organizationMembership.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: [
        { role: "asc" }, // owner first
        { createdAt: "asc" },
      ],
    });
  }),

  // ─── Member Management ────────────────────────────────

  createMember: orgAdminProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(255),
        pin: z
          .string()
          .min(4)
          .max(10)
          .regex(/^\d+$/, "PIN must be numeric")
          .optional()
          .nullable(),
        isPinOnly: z.boolean().default(false),
        isSystemAccount: z.boolean().default(false),
        isAdmin: z.boolean().default(false),
        role: z.enum(["admin", "staff"]).default("staff"),
        userId: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // PIN-only accounts must have a PIN
      if (input.isPinOnly && !input.pin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PIN-only accounts must have a PIN",
        });
      }

      // Check for PIN uniqueness within org
      if (input.pin) {
        const existing = await ctx.db.organizationMembership.findFirst({
          where: {
            organizationId: ctx.organizationId,
            pin: input.pin,
          },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This PIN is already in use within your organization",
          });
        }
      }

      // Check for userId uniqueness within org
      if (input.userId) {
        const existing = await ctx.db.organizationMembership.findFirst({
          where: {
            organizationId: ctx.organizationId,
            userId: input.userId,
          },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This user is already a member of your organization",
          });
        }
      }

      return ctx.db.organizationMembership.create({
        data: {
          organizationId: ctx.organizationId,
          displayName: input.displayName,
          pin: input.pin ?? null,
          isPinOnly: input.isPinOnly,
          isSystemAccount: input.isSystemAccount,
          isAdmin: input.isAdmin,
          role: input.role,
          userId: input.userId ?? null,
        },
      });
    }),

  updateMember: orgAdminProcedure
    .input(
      z.object({
        membershipId: z.string(),
        displayName: z.string().min(1).max(255).optional(),
        pin: z
          .string()
          .min(4)
          .max(10)
          .regex(/^\d+$/, "PIN must be numeric")
          .optional()
          .nullable(),
        isPinOnly: z.boolean().optional(),
        isSystemAccount: z.boolean().optional(),
        isAdmin: z.boolean().optional(),
        role: z.enum(["owner", "admin", "staff"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationMembership.findFirst({
        where: {
          id: input.membershipId,
          organizationId: ctx.organizationId,
        },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      // Can't modify owner role unless you ARE the owner
      if (member.role === "owner" && ctx.membership.role !== "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the owner can modify owner accounts",
        });
      }

      // Can't promote to owner (use transferOwnership instead)
      if (input.role === "owner" && member.role !== "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use the transfer ownership feature to change owners",
        });
      }

      // Check PIN uniqueness if changing
      if (input.pin && input.pin !== member.pin) {
        const existing = await ctx.db.organizationMembership.findFirst({
          where: {
            organizationId: ctx.organizationId,
            pin: input.pin,
            id: { not: input.membershipId },
          },
        });
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This PIN is already in use within your organization",
          });
        }
      }

      const { membershipId, ...updateData } = input;
      return ctx.db.organizationMembership.update({
        where: { id: membershipId },
        data: updateData,
      });
    }),

  removeMember: orgAdminProcedure
    .input(z.object({ membershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationMembership.findFirst({
        where: {
          id: input.membershipId,
          organizationId: ctx.organizationId,
        },
      });

      if (!member) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      // Can't remove the owner
      if (member.role === "owner") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cannot remove the organization owner",
        });
      }

      // Can't remove yourself
      if (member.id === ctx.membershipId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot remove yourself",
        });
      }

      return ctx.db.organizationMembership.delete({
        where: { id: input.membershipId },
      });
    }),

  // ─── PIN Verification (for kiosk mode) ────────────────

  verifyPin: orgProcedure
    .input(z.object({ pin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationMembership.findFirst({
        where: {
          organizationId: ctx.organizationId,
          pin: input.pin,
        },
      });

      if (!member) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid PIN",
        });
      }

      return {
        membershipId: member.id,
        displayName: member.displayName,
        role: member.role,
        isAdmin: member.isAdmin,
      };
    }),

  /** PIN challenge: verify a PIN has a specific permission flag */
  pinChallenge: orgProcedure
    .input(
      z.object({
        pin: z.string(),
        requiredPermission: z.enum(["isAdmin"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const member = await ctx.db.organizationMembership.findFirst({
        where: {
          organizationId: ctx.organizationId,
          pin: input.pin,
        },
      });

      if (!member) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid PIN" });
      }

      // Check the required permission flag
      const hasPermission = member[input.requiredPermission];
      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `This action requires ${input.requiredPermission} permission`,
        });
      }

      return {
        authorized: true,
        authorizerName: member.displayName,
        authorizerMembershipId: member.id,
      };
    }),

  // ─── Owner-Only Operations ────────────────────────────

  updateOrg: orgOwnerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.organization.update({
        where: { id: ctx.organizationId },
        data: input,
      });
    }),

  transferOwnership: orgOwnerProcedure
    .input(z.object({ newOwnerMembershipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const newOwner = await ctx.db.organizationMembership.findFirst({
        where: {
          id: input.newOwnerMembershipId,
          organizationId: ctx.organizationId,
        },
      });

      if (!newOwner) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      if (newOwner.isPinOnly) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot transfer ownership to a PIN-only account",
        });
      }

      // Demote current owner to admin, promote new owner
      await ctx.db.$transaction([
        ctx.db.organizationMembership.update({
          where: { id: ctx.membershipId },
          data: { role: "admin" },
        }),
        ctx.db.organizationMembership.update({
          where: { id: input.newOwnerMembershipId },
          data: { role: "owner", isAdmin: true },
        }),
      ]);

      return { success: true };
    }),
});
