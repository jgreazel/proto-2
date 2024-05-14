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
    <>
      <div className="p-4">Which items are you restocking today?</div>
      {props.isLoading ? (
        <LoadingPage />
      ) : (
        <div className="grid w-full grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-5">
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
                  <span className="text-sm"> {i.item.inStock} in stock</span>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}
      <div className="divider"></div>
    </>
  );
};

const RestockForm = (props: {
  selected: string[];
  data: { item: InventoryItem }[];
  onSubmit: (arr: { id: string; restockAmount: number }[]) => void;
}) => {
  const { selected, data } = props;
  const { register, watch, handleSubmit, getValues, formState } =
    useForm<Record<string, number>>();
  const watchAll = watch();

  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={handleSubmit(() => {
        const values = getValues(selected);
        const input: { id: string; restockAmount: number }[] = [];
        selected.forEach((x, idx) => {
          input.push({ id: x, restockAmount: values[idx]! });
        });
        props.onSubmit(input);
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
            {watchAll[i.item.id] !== undefined && watchAll[i.item.id]! > 0 && (
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
      <Button
        primary
        type="submit"
        disabled={!selected.length || !formState.isValid}
      >
        Submit
      </Button>
    </form>
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
        <dialog id="restock-modal" className="modal modal-open">
          <form method="dialog" className="modal-backdrop">
            <Link href="/items">close</Link>
          </form>
          <div className="modal-box h-full max-w-4xl">
            <form method="dialog">
              <Link
                href="/items"
                className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </Link>
            </form>
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
        </dialog>
      </PageLayout>
    </>
  );
}

export default isAuth(RestockPage);
