import { createTRPCRouter } from "~/server/api/trpc";
import { itemsRouter } from "./routers/items";
import { profileRouter } from "./routers/profile";
import { passesRouter } from "./routers/passes";
import { reportsRouter } from "./routers/reports";
import { schedulesRouter } from "./routers/schedules";
import { documentsRouter } from "./routers/documents";
import { timeclockAdminRouter } from "./routers/timeclockAdmin";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  items: itemsRouter,
  profile: profileRouter,
  passes: passesRouter,
  reports: reportsRouter,
  schedules: schedulesRouter,
  documents: documentsRouter,
  timeclockAdmin: timeclockAdminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
