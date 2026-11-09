import { test as base, expect } from "@playwright/test";

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// Vercel Deployment Protection: send the bypass header to the deployment origin only (never Clerk etc.)
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    if (bypass && baseURL) {
      const origin = new URL(baseURL).origin;
      await context.route(
        (url) => url.origin === origin,
        (route) =>
          route.continue({
            headers: { ...route.request().headers(), "x-vercel-protection-bypass": bypass },
          }),
      );
    }
    await use(context);
  },
});

export { expect };
