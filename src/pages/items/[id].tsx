import { SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";
import { Button } from "~/components/button";

const CreateConcessionItemWizard = () => {
  const [label, setLabel] = useState("");
  const [purchPrice, setPurchPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [initStock, setInitStock] = useState("");

  const ctx = api.useUtils();
  const { mutate, isLoading: isCreating } = api.items.create.useMutation({
    onSuccess: () => {
      setLabel("");
      setPurchPrice("");
      setSellingPrice("");
      setInitStock("");
      void ctx.items.getAll.invalidate();
    },
    onError: (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const msg = JSON.parse(e.message)[0].message as string | undefined;
      if (msg) toast.error(msg);
    },
  });

  return (
    <div className="flex w-full gap-3">
      <div className="flex grow flex-col gap-2">
        <label className="text-xs font-medium">Label</label>
        <input
          id="label"
          placeholder="Ex: Candy Bar"
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={isCreating}
        />
        <label className="text-xs font-medium">Purchase Price</label>
        <input
          id="purchase-price"
          type="number"
          placeholder="Ex: 50 ($0.50)"
          step={25}
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          value={purchPrice}
          onChange={(e) => setPurchPrice(e.target.value)}
          disabled={isCreating}
        />
        <label className="text-xs font-medium">Selling Price</label>
        <input
          id="sell-price"
          type="number"
          step={25}
          placeholder="Ex: 150 ($1.50)"
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          value={sellingPrice}
          onChange={(e) => setSellingPrice(e.target.value)}
          disabled={isCreating}
        />
        <label className="text-xs font-medium">Initial Stock</label>
        <input
          id="init-stock"
          type="number"
          placeholder="Ex: 0"
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          value={initStock}
          onChange={(e) => setInitStock(e.target.value)}
          disabled={isCreating}
        />
        {label !== "" &&
          sellingPrice &&
          purchPrice &&
          initStock &&
          !isCreating && (
            <Button
              disabled={isCreating}
              onClick={() =>
                mutate({
                  label,
                  sellingPrice: parseInt(sellingPrice),
                  purchasePrice: parseInt(purchPrice),
                  inStock: parseInt(initStock),
                })
              }
            >
              Create
            </Button>
          )}
        {isCreating && (
          <div className="flex items-center justify-center">
            <LoadingSpinner size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

export default function SingleItemPage() {
  return (
    <>
      <Head>
        <title>GS: Single Item</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">
            <CreateConcessionItemWizard />
          </div>
        </div>
      </main>
    </>
  );
}
