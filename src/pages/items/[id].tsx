import { SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";
import { useForm, SubmitHandler } from "react-hook-form";

import { type RouterOutputs, api } from "~/utils/api";
import { Button } from "~/components/button";
import { useParams } from "next/navigation";
import type { InventoryItem } from "@prisma/client";

type CreateForm = {
  label: string;
  purchasePrice: number;
  sellingPrice: number;
  inStock: number;
};

const CreateFormComponent = (props: {
  onSubmit: (data: CreateForm) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: CreateForm;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const { register, handleSubmit, watch, formState, reset } =
    useForm<CreateForm>({
      defaultValues: {
        label: "",
        purchasePrice: 0,
        sellingPrice: 0,
        inStock: 0,
      },
    });
  const watchForm = watch();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit(() => {
        onSubmit(watchForm);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        placeholder="Ex: Candy Bar"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("label", {
          required: true,
          disabled: isSubmitting || isLoading,
        })}
      />
      <label className="text-xs font-medium">Purchase Price</label>
      <input
        id="purchase-price"
        type="number"
        placeholder="Ex: 50 ($0.50)"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("purchasePrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <input
        id="sell-price"
        type="number"
        placeholder="Ex: 150 ($1.50)"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("sellingPrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      <label className="text-xs font-medium">Quantity in Stock</label>
      <input
        id="init-stock"
        type="number"
        placeholder="Ex: 0"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("inStock", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      {formState.isValid && !isSubmitting && (
        <Button disabled={isSubmitting} type="submit">
          {data ? "Save" : "Create"}
        </Button>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </form>
  );
};

const CreateConcessionItemWizard = () => {
  // ctx v. api: ctx = server side OR as part of the request
  const ctx = api.useUtils();
  const { mutate, isLoading: isCreating } =
    api.items.createConcessionItem.useMutation({
      onSuccess: () => {
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
      <CreateFormComponent
        isLoading={false}
        isSubmitting={isCreating}
        onSubmit={mutate}
      />
    </div>
  );
};

const EditConcessionItemWizard = (props: { id: string }) => {
  const { data, isLoading } = api.items.getById.useQuery({ id: props.id });

  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } =
    api.items.updateConcessionItem.useMutation({
      onSuccess: () => {
        void ctx.items.getById.invalidate();
      },
      onError: (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const msg = JSON.parse(e.message)[0].message as string | undefined;
        if (msg) toast.error(msg);
      },
    });

  return (
    <div className="flex w-full gap-3">
      <CreateFormComponent
        data={data?.item as CreateForm}
        isLoading={isLoading}
        isSubmitting={isUpdating}
        onSubmit={(data) => mutate({ ...data, id: props.id })}
      />
    </div>
  );
};

export default function SingleItemPage() {
  const params = useParams();
  const id = params?.id ?? "0";

  return (
    <>
      <Head>
        <title>GS: Single Item</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">
            {id === "0" ? (
              <CreateConcessionItemWizard />
            ) : (
              <EditConcessionItemWizard id={id as string} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
