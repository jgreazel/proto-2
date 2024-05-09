import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

/**
 * @throw Error TRPCError if rate exceeded
 * @param createdById
 */
const inRateWindow = async (createdById: string) => {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
  });

  const { success } = await ratelimit.limit(createdById);
  if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
};

export default inRateWindow;
