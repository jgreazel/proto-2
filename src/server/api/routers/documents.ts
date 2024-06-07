// import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

import {
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// import inRateWindow from "../helpers/inRateWindow";

const Bucket = process.env.AWS_BUCKET;

export const documentsRouter = createTRPCRouter({
  getAll: privateProcedure.query(async ({ ctx }) => {
    // await inRateWindow(ctx.userId);

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
      // await inRateWindow(ctx.userId);

      const cmd = new GetObjectCommand({ Bucket, Key: input.key });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const src = await getSignedUrl(ctx.s3, cmd, { expiresIn: 3600 });
      return src;
    }),

  getStandardUploadPresignedUrl: privateProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // await inRateWindow(ctx.userId);
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
      // await inRateWindow(ctx.userId);
      const deleteCmd = new DeleteObjectCommand({ Bucket, Key: input.key });
      return await ctx.s3.send(deleteCmd);
    }),
});
