import { type AppType } from "next/app";
import { ClerkProvider } from "@clerk/nextjs";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { Toaster } from "react-hot-toast";
import Head from "next/head";

export type RangeValueType<DateType> = [
  start: DateType | null | undefined,
  end: DateType | null | undefined,
];

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ClerkProvider>
      <Head>
        <title>Guard Shack</title>
        <meta
          name="description"
          content="Bookkeeping software for lifeguards"
        />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Toaster position="bottom-center" />
      <Component {...pageProps} />
    </ClerkProvider>
  );
};

export default api.withTRPC(MyApp);
