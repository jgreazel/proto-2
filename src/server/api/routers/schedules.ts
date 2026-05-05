import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, orgProcedure, orgAdminProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";
// import inRateWindow from "../helpers/inRateWindow";
import dayjs from "dayjs";

const ONEYEARMILLIS = 86400000;

export const schedulesRouter = createTRPCRouter({
  getShifts: orgProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        dateRange: z.tuple([z.date(), z.date()]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const shifts = await ctx.db.shift.findMany({
        where: {
          organizationId: ctx.organizationId,
          userId: input.userId,
          start: {
            gte: input.dateRange?.[0],
          },
          end: {
            lte: input.dateRange?.[1],
          },
        },
        orderBy: {
          start: "asc",
        },
      });
      return Promise.all(
        shifts.map(async (s) => ({
          ...s,
          username: (await clerkClient.users.getUser(s.userId)).username,
        })),
      );
    }),

  createShift: orgAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        start: z.date(),
        end: z.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;
      // await inRateWindow(createdById);

      const shift = await ctx.db.shift.create({
        data: {
          ...input,
          createdBy: createdById,
          organizationId: ctx.organizationId,
        },
      });
      if (!shift) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new shift",
        });
      }
      const username = (await clerkClient.users.getUser(shift.userId)).username;

      return { ...shift, username };
    }),

  editShift: orgAdminProcedure
    .input(
      z.object({
        id: z.string(),
        userId: z.string().optional(),
        start: z.date().optional(),
        end: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Verify shift belongs to org
      const existing = await ctx.db.shift.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shift not found" });
      }

      const shift = await ctx.db.shift.update({
        where: { id: input.id },
        data: {
          ...input,
        },
      });
      if (!shift) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new shift",
        });
      }
      const username = (await clerkClient.users.getUser(shift.userId)).username;
      return { ...shift, username };
    }),

  deleteShift: orgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Verify shift belongs to org
      const existing = await ctx.db.shift.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shift not found" });
      }

      const result = await ctx.db.shift.delete({
        where: { id: input.id },
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete shift",
        });
      }
      return result;
    }),

  // safest to use source.startof('day') on the UI
  cloneDay: orgAdminProcedure
    .input(z.object({ source: z.date(), target: z.date() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      const srcBegin = new Date(input.source);
      srcBegin.setHours(0, 0, 0, 0);
      const srcShifts = await ctx.db.shift.findMany({
        where: {
          organizationId: ctx.organizationId,
          start: {
            gte: srcBegin,
            lt: new Date(input.source.getTime() + ONEYEARMILLIS),
          },
        },
      });

      const shiftsToAdd = srcShifts.map((s) => {
        const targetStart = new Date(s.start);
        targetStart.setFullYear(input.target.getFullYear());
        targetStart.setMonth(input.target.getMonth());
        targetStart.setDate(input.target.getDate());

        const targetEnd = new Date(s.end);
        targetEnd.setFullYear(input.target.getFullYear());
        targetEnd.setMonth(input.target.getMonth());
        targetEnd.setDate(input.target.getDate());

        return {
          userId: s.userId,
          start: targetStart,
          end: targetEnd,
          createdBy: ctx.userId,
          organizationId: ctx.organizationId,
        };
      });
      const result = await ctx.db.shift.createMany({
        data: shiftsToAdd,
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to clone shifts",
        });
      }
      return result;
    }),

  createHourCode: orgAdminProcedure
    .input(
      z.object({
        label: z.string(),
        hourlyRate: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const hc = await ctx.db.hourCode.create({
        data: {
          label: input.label,
          hourlyRate: input.hourlyRate,
          createdBy: createdById,
          organizationId: ctx.organizationId,
        },
      });
      if (!hc) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create the Hour Code object in the Database.",
        });
      }
      return hc;
    }),

  getHourCodes: orgProcedure.query(
    async ({ ctx }) =>
      await ctx.db.hourCode.findMany({
        where: { organizationId: ctx.organizationId },
      }),
  ),

  editHourCode: orgAdminProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string(),
        hourlyRate: z.number().min(0).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Verify hour code belongs to org
      const existing = await ctx.db.hourCode.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hour code not found" });
      }

      const hc = await ctx.db.hourCode.update({
        where: { id: input.id },
        data: { ...input },
      });

      if (!hc) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create a new Hour Code",
        });
      }
      return hc;
    }),

  deleteHourCode: orgAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);

      // Verify hour code belongs to org
      const existing = await ctx.db.hourCode.findFirst({
        where: { id: input.id, organizationId: ctx.organizationId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Hour code not found" });
      }

      const result = await ctx.db.hourCode.delete({
        where: { id: input.id },
      });
      if (!result) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete Hour Code",
        });
      }
      return result;
    }),

  // new
  createTimeClockEvent: orgProcedure
    .input(
      z.object({
        clockPIN: z.string().length(4).optional(),
        userId: z.string(),
        manualDateTime: z.date().optional(),
        adminUserId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const createdById = ctx.userId;

      const membership = await ctx.db.organizationMembership.findFirst({
        where: { organizationId: ctx.organizationId, userId: input.userId },
      });
      if (!membership?.pin) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "No clock PIN found for this user. Please set one in User Management.",
        });
      }

      const isAdminRequest = !!input.adminUserId && input.adminUserId === ctx.userId;
      const adminMembership = isAdminRequest
        ? await ctx.db.organizationMembership.findFirst({
            where: { organizationId: ctx.organizationId, userId: input.adminUserId },
          })
        : null;

      const pinMismatch =
        input.clockPIN?.toUpperCase() !== membership.pin.toUpperCase();
      if (pinMismatch && !adminMembership?.isAdmin) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Incorrect Clock PIN",
        });
      }

      const tce = await ctx.db.timeClockEvent.create({
        data: {
          userId: input.userId,
          createdBy: createdById,
          createdAt: input.manualDateTime ?? undefined,
          organizationId: ctx.organizationId,
        },
      });

      if (!tce) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to create Time Clock event.",
        });
      }
      return tce;
    }),

  getEligibleStaff: orgAdminProcedure
    .input(
      z.object({
        dateRange: z.tuple([z.date(), z.date()]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const memberships = await ctx.db.organizationMembership.findMany({
        where: { organizationId: ctx.organizationId },
      });

      const clerkUserIds = memberships
        .filter((m) => m.userId !== null)
        .map((m) => m.userId!);

      const clerkUsers =
        clerkUserIds.length > 0
          ? await clerkClient.users
              .getUserList({ userId: clerkUserIds, limit: 500 })
              .then((res) => res.map(filterUserForClient))
          : [];

      const tces = input.dateRange
        ? await ctx.db.timeClockEvent.findMany({
            where: {
              organizationId: ctx.organizationId,
              createdAt: {
                gte: input.dateRange[0],
                lte: input.dateRange[1],
              },
            },
            orderBy: { createdAt: "asc" },
          })
        : [];

      return memberships.map((m) => {
        const clerkUser = clerkUsers.find((u) => u.id === m.userId);
        const fullName = clerkUser
          ? `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim()
          : "";
        const displayName = clerkUser
          ? (fullName !== "" ? fullName : (clerkUser.username ?? m.id))
          : (m.displayName.trim() !== "" ? m.displayName.trim() : m.id);
        const userTces = tces.filter((t) => t.userId === (m.userId ?? m.id));
        return {
          userId: m.userId ?? m.id,
          membershipId: m.id,
          displayName,
          username: clerkUser?.username ?? m.displayName,
          hasPin: !!m.pin,
          isAdmin: m.isAdmin,
          timeClockEvents: userTces,
        };
      });
    }),
});
