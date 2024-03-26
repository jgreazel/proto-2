// import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters
import {
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const Bucket = process.env.AWS_BUCKET;

// Create a new ratelimiter, that allows 3 req per 1 min
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

export const documentsRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    const { success } = await ratelimit.limit(ctx.userId);
    if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

    const response = await ctx.s3.send(new ListObjectsCommand({ Bucket }));
    return response.Contents ?? [];
  }),

  getSignedUrl: privateProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { success } = await ratelimit.limit(ctx.userId);
      if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

      const cmd = new GetObjectCommand({ Bucket, Key: input.key });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const src = await getSignedUrl(ctx.s3, cmd, { expiresIn: 3600 });
      return src;
    }),

  getStandardUploadPresignedUrl: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { s3 } = ctx;

      const putObjectCommand = new PutObjectCommand({
        Bucket,
        Key: input.key,
      });

      return await getSignedUrl(s3, putObjectCommand);
    }),

  deleteItem: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleteCmd = new DeleteObjectCommand({ Bucket, Key: input.key });
      return await ctx.s3.send(deleteCmd);
    }),
});
