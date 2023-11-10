import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/dist/types/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const filterUserForClient = (user: User) => {
  return { id: user.id, username: user.username, imageUrl: user.imageUrl };
};

export const itemsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.concessionItem.findMany({ take: 100 });

    const users = await clerkClient.users
      .getUserList({
        userId: items.map((i) => i.createdBy),
        limit: 100,
      })
      .then((res) => res.filter(filterUserForClient));

    console.log(users);

    return items.map((i) => {
      const createdBy = users.find((u) => u.id === i.createdBy);
      if (!createdBy)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User data not found",
        });

      return {
        item: i,
        createdBy,
      };
    });
  }),
});
