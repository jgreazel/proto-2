import { test as base, expect } from "@playwright/test";

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

// Vercel Deployment Protection: send the bypass header to the deployment origin only (never Clerk etc.)
export const test = base.extend({
  context: async ({ context, baseURL }, use) => {
    if (bypass && baseURL) {
      const origin = new URL(baseURL).origin;
      await context.route(
        (url) => url.origin === origin,
        // fetch without following redirects so the header never reaches the redirect target
        async (route) => {
          const response = await route.fetch({
            headers: { ...route.request().headers(), "x-vercel-protection-bypass": bypass },
            maxRedirects: 0,
          });
          await route.fulfill({ response });
        },
      );
    }
    await use(context);
  },
});

export { expect };
