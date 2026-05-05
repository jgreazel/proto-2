import { z } from "zod";

import { createTRPCRouter, orgProcedure, orgAdminProcedure } from "~/server/api/trpc";

import {
  ListObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const Bucket = process.env.AWS_BUCKET;

// S3 keys are prefixed with orgId for tenant isolation
function orgPrefix(organizationId: string) {
  return `org-${organizationId}/`;
}

export const documentsRouter = createTRPCRouter({
  getAll: orgProcedure.query(async ({ ctx }) => {
    const prefix = orgPrefix(ctx.organizationId);
    const response = await ctx.s3.send(
      new ListObjectsCommand({ Bucket, Prefix: prefix }),
    );
    return (response.Contents ?? []).map((obj) => ({
      ...obj,
      Key: obj.Key?.replace(prefix, ""),
    }));
  }),

  getSignedUrl: orgProcedure
    .input(
      z.object({
        key: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const cmd = new GetObjectCommand({
        Bucket,
        Key: `${orgPrefix(ctx.organizationId)}${input.key}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const src = await getSignedUrl(ctx.s3, cmd, { expiresIn: 3600 });
      return src;
    }),

  getStandardUploadPresignedUrl: orgProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { s3 } = ctx;

      const putObjectCommand = new PutObjectCommand({
        Bucket,
        Key: `${orgPrefix(ctx.organizationId)}${input.key}`,
      });

      return await getSignedUrl(s3, putObjectCommand);
    }),

  renameItem: orgAdminProcedure
    .input(z.object({ oldKey: z.string(), newKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const prefix = orgPrefix(ctx.organizationId);
      const copyCmd = new CopyObjectCommand({
        Bucket,
        CopySource: `${Bucket ?? ""}/${prefix}${input.oldKey}`,
        Key: `${prefix}${input.newKey}`,
      });
      await ctx.s3.send(copyCmd);

      const deleteCmd = new DeleteObjectCommand({
        Bucket,
        Key: `${prefix}${input.oldKey}`,
      });
      await ctx.s3.send(deleteCmd);

      return { key: input.newKey };
    }),

  deleteItem: orgAdminProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleteCmd = new DeleteObjectCommand({
        Bucket,
        Key: `${orgPrefix(ctx.organizationId)}${input.key}`,
      });
      return await ctx.s3.send(deleteCmd);
    }),
});
