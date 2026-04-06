/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { getAuth } from "@clerk/nextjs/server";
import { TRPCError, initTRPC } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "~/server/db";
import { s3 } from "../aws/s3";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req } = opts;
  const session = getAuth(req);
  const userId = session.userId;

  return {
    db,
    userId,
    s3,
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

// ─── Legacy Procedures (kept for backwards compatibility during migration) ───

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const privateProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceUserIsAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const settings = await ctx.db.userSettings.findFirst({
    where: { userId: ctx.userId },
  });

  if (!settings?.isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({ ctx: { userId: ctx.userId } });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);

// ─── Organization-Aware Procedures ──────────────────────────────
// These resolve the user's org membership and inject organizationId into context.
// Use these instead of privateProcedure/adminProcedure for tenant-isolated routes.

/**
 * Resolves the calling user's OrganizationMembership from their Clerk userId.
 * Injects organizationId and membershipId into context.
 */
const enforceOrgMembership = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const membership = await ctx.db.organizationMembership.findFirst({
    where: { userId: ctx.userId },
    include: { organization: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of any organization",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      membership,
    },
  });
});

/** Requires Clerk auth + org membership. Use for any org-scoped route. */
export const orgProcedure = t.procedure.use(enforceOrgMembership);

/** Requires org membership + admin or owner role. */
const enforceOrgAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const membership = await ctx.db.organizationMembership.findFirst({
    where: { userId: ctx.userId },
    include: { organization: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of any organization",
    });
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      membership,
    },
  });
});

export const orgAdminProcedure = t.procedure.use(enforceOrgAdmin);

/** Requires org membership + owner role. For billing and org-level settings. */
const enforceOrgOwner = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const membership = await ctx.db.organizationMembership.findFirst({
    where: { userId: ctx.userId },
    include: { organization: true },
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of any organization",
    });
  }

  if (membership.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Owner access required",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      membership,
    },
  });
});

export const orgOwnerProcedure = t.procedure.use(enforceOrgOwner);
