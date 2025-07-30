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
    <div className="rounded-lg bg-base-100 p-4 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold">
        Which items are you restocking today?
      </h2>
      {props.isLoading ? (
        <LoadingPage />
      ) : (
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {props.data?.map((i) => (
            <div key={i.item.id} className="form-control">
              <label className="label w-fit cursor-pointer gap-2">
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
                  className="checkbox"
                />
                <div className="flex flex-col">
                  <span className="label-text font-medium">{i.item.label}</span>
                  <span className="text-sm text-base-content/70">
                    {" "}
                    {i.item.inStock} in stock
                  </span>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
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
    <div className="rounded-lg bg-base-100 p-4 shadow-lg">
      <h2 className="mb-4 text-lg font-semibold">Restock Details</h2>

      <form
        className="flex flex-col gap-4"
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
        {data
          ?.filter((d) => selected.includes(d.item.id))
          .map((i) => (
            <div
              key={i.item.id}
              className="flex flex-row items-center justify-between rounded-lg bg-base-100 p-2 shadow-xl"
            >
              <div>
                <div className="font-semibold ">{i.item.label}</div>
                <div className="text-sm">{i.item.inStock} in stock</div>
              </div>
              {watchAll[i.item.id] !== undefined &&
                watchAll[i.item.id]! > 0 && (
                  <div className="flex flex-row items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                    <div className="badge badge-outline">
                      {i.item.inStock! + watchAll[i.item.id]!} in stock
                    </div>
                  </div>
                )}
              <label className="form-control">
                <div className="label">
                  <span className="label-text">Amount restocking:</span>
                </div>
                <input
                  id={i.item.id}
                  className="input input-sm input-bordered"
                  type="number"
                  {...register(i.item.id, {
                    required: true,
                    valueAsNumber: true,
                  })}
                />
              </label>
            </div>
          ))}

        <div className="mt-4 p-2">
          <label className="form-control">
            <div className="label">
              <span className="label-text font-semibold">
                Change Note (optional)
              </span>
            </div>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Describe the reason for this restock (e.g., 'Weekly inventory restock', 'Emergency restock due to high demand')..."
              rows={3}
              {...register("changeNote")}
            />
            <div className="label">
              <span className="label-text-alt">
                This note will be recorded for accountability purposes
              </span>
            </div>
          </label>
        </div>

        <Button
          primary
          type="submit"
          disabled={!selected.length || !formState.isValid}
        >
          Submit
        </Button>
      </form>
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
        <title>Guard Shack - Restock</title>
      </Head>
      <PageLayout>
        <div className="flex h-full w-full flex-col gap-4 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Restock Items</h1>
            <Link href="/items" className="btn btn-outline">
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
              Back to Items
            </Link>
          </div>

          <SelectionHeader
            data={data}
            isLoading={isLoading || isUpdating}
            value={selected}
            setValue={setSelected}
          />

          {selected.length ? (
            <RestockForm
              data={data as { item: InventoryItem }[]}
              selected={selected}
              onSubmit={mutate}
            />
          ) : (
            <div role="alert" className="alert">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-info"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>No items selected.</span>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
}

export default isAuth(RestockPage);
