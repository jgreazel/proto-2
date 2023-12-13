import { SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";

export default function SingleItemPage() {
  // start fetching early
  api.items.getAll.useQuery();

  return (
    <>
      <Head>
        <title>GS: Shipment</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">Shipment</div>
        </div>
      </main>
    </>
  );
}
