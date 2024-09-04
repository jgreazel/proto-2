import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { filterUserForClient } from "../helpers/filterUsersForClient";

// todo: come back once i have the permissions spec done
// new plan: pry not use this. router match ui pages, utilize modules
// this will pry go in a home or common router
export const layoutRouter = createTRPCRouter({
  // getSideNav: privateProcedure
  //   // no input, assumed to have user id in header since private proc
  //   .query(async ({ ctx }) => {
  //     const userId = ctx.userId;
  //     // const userRoleLinks = await ctx.db.user_Role.findMany({
  //     //   where: {
  //     //     userId: userId,
  //     //   },
  //     //   include: {
  //     //     role: {
  //     //       include: {
  //     //         permissions: {
  //     //           include: { permission: true },
  //     //         },
  //     //       },
  //     //     },
  //     //   },
  //     // });
  //   }),
});
