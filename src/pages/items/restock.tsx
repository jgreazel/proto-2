import Head from "next/head";
import { useState } from "react";
import { LoadingPage } from "~/components/loading";
import toast from "react-hot-toast";

import { api } from "~/utils/api";
import { useForm } from "react-hook-form";
import { Button } from "~/components/button";
import type { InventoryItem } from "@prisma/client";
import handleApiError from "~/helpers/handleApiError";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import { useRouter } from "next/router";
import isAuth from "~/components/isAuth";

const SelectionHeader = (props: {
  value: string[];
  setValue: (arg: (prev: string[]) => string[]) => void;
  data?: { item: InventoryItem }[];
  isLoading: boolean;
}) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="card-title text-xl font-bold text-base-content">
              Select Items to Restock
            </h2>
            <p className="text-base-content/70">
              Choose concession items to restock
            </p>
          </div>
          {props.value.length > 0 && (
            <div className="badge badge-primary badge-lg">
              {props.value.length} selected
            </div>
          )}
        </div>
        {props.isLoading ? (
          <LoadingPage />
        ) : (
          <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {props.data?.map((i) => (
              <div key={i.item.id} className="form-control">
                <label className="label cursor-pointer justify-start gap-2 rounded-lg border border-base-300 p-3 transition-colors hover:border-primary/50 hover:bg-base-200/50">
                  <input
                    id={i.item.id}
                    type="checkbox"
                    value={i.item.id}
                    onChange={(e) =>
                      e.target.checked
                        ? props.setValue((prev) => [...prev, e.target.id])
                        : props.setValue((prev) =>
                            prev.filter((i) => i !== e.target.id),
                          )
                    }
                    className="checkbox-primary checkbox checkbox-sm"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="label-text truncate text-sm font-semibold"
                      title={i.item.label}
                    >
                      {i.item.label}
                    </span>
                    <span
                      className={`w-fit rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        (i.item.inStock ?? 0) === 0
                          ? "bg-error/10 text-error"
                          : (i.item.inStock ?? 0) <= 10
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {i.item.inStock ?? 0} units
                    </span>
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RestockForm = (props: {
  selected: string[];
  data: { item: InventoryItem }[];
  onSubmit: (data: {
    items: { id: string; restockAmount: number }[];
    changeNote?: string;
  }) => void;
}) => {
  const { selected, data } = props;
  const { register, watch, handleSubmit, getValues, formState } = useForm<
    Record<string, number> & { changeNote: string }
  >();
  const watchAll = watch();

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="card-title text-xl font-bold text-base-content">
              Restock Details
            </h2>
            <p className="text-base-content/70">
              Enter quantities for {selected.length} selected items
            </p>
          </div>
        </div>

        <form
          className="flex flex-col gap-6"
          onSubmit={handleSubmit(() => {
            const values = getValues();
            const items: { id: string; restockAmount: number }[] = [];
            selected.forEach((x) => {
              const amount = values[x];
              if (amount !== undefined) {
                items.push({ id: x, restockAmount: amount });
              }
            });
            props.onSubmit({ items, changeNote: values.changeNote });
          })}
        >
          {/* Compact grid layout for restock items */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {data
              ?.filter((d) => selected.includes(d.item.id))
              .map((i) => (
                <div
                  key={i.item.id}
                  className="bg-base-50 rounded-lg border border-base-300 p-3 transition-colors hover:bg-base-100"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3
                      className="truncate pr-2 text-sm font-semibold"
                      title={i.item.label}
                    >
                      {i.item.label}
                    </h3>
                    <span
                      className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        (i.item.inStock ?? 0) === 0
                          ? "bg-error/10 text-error"
                          : (i.item.inStock ?? 0) <= 10
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {i.item.inStock ?? 0} units
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <label className="text-xs font-medium text-base-content/70">
                      Add:
                    </label>
                    <input
                      id={i.item.id}
                      className="input input-sm input-bordered flex-1"
                      type="number"
                      min="0"
                      placeholder="0"
                      {...register(i.item.id, {
                        required: true,
                        valueAsNumber: true,
                        min: 1,
                      })}
                    />
                  </div>

                  {watchAll[i.item.id] !== undefined &&
                    watchAll[i.item.id]! > 0 && (
                      <div className="flex items-center gap-1 text-xs">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="h-3 w-3 text-success"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                        <span className="font-medium text-success">
                          New total:{" "}
                          {(i.item.inStock ?? 0) + watchAll[i.item.id]!}
                        </span>
                      </div>
                    )}
                </div>
              ))}
          </div>

          {/* Compact change note section */}
          <div className="rounded-lg bg-base-200/30 p-4">
            <label className="form-control">
              <div className="label pb-2">
                <span className="label-text font-semibold">Change Note</span>
                <span className="label-text-alt text-error">Required</span>
              </div>
              <textarea
                className="textarea textarea-bordered textarea-sm"
                placeholder="Reason for restock (e.g., 'Weekly inventory', 'Vendor delivery #12345', 'Emergency restock')..."
                rows={2}
                {...register("changeNote", { required: true })}
              />
            </label>
          </div>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            <Link href="/items" className="btn btn-outline btn-sm">
              Cancel & Return
            </Link>
            <Button
              primary
              type="submit"
              disabled={!selected.length || !formState.isValid}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              Complete Restock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
function RestockPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  const { data, isLoading } = api.items.getAll.useQuery({
    category: "concession",
  });
  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } = api.items.restockItems.useMutation({
    onSuccess: async (x) => {
      void ctx.items.getAll.invalidate();
      setSelected([]);
      toast.success(x.message);
      await router.push("/items");
    },
    onError: handleApiError,
  });

  return (
    <>
      <Head>
        <title>Guard Shack - Bulk Restock</title>
      </Head>
      <PageLayout>
        <div className="flex h-full w-full flex-col gap-6">
          {/* Compact Header Section */}
          <div className="flex w-full items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-base-content">
                Bulk Restock
              </h1>
              <p className="text-sm text-base-content/70">
                Replenish concession inventory
              </p>
            </div>

            <Link href="/items" className="btn btn-outline btn-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
              Back to Inventory
            </Link>
          </div>

          <SelectionHeader
            data={data}
            isLoading={isLoading || isUpdating}
            value={selected}
            setValue={setSelected}
          />

          {selected.length > 0 ? (
            <RestockForm
              data={data as { item: InventoryItem }[]}
              selected={selected}
              onSubmit={mutate}
            />
          ) : (
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body py-8">
                <div className="flex items-center justify-center gap-3">
                  <div className="rounded-full bg-info/10 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="h-5 w-5 stroke-info"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold">No Items Selected</h3>
                    <p className="text-sm text-base-content/70">
                      Select items above to begin restocking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
}

export default isAuth(RestockPage);
