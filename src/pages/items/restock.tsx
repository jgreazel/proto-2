import Head from "next/head";
import { useState } from "react";
import { LoadingPage } from "~/components/loading";
import toast from "react-hot-toast";

import { api } from "~/utils/api";
import { useForm } from "react-hook-form";
import { Button } from "~/components/button";
import type { InventoryItem } from "@prisma/client";
import handleApiError from "~/helpers/handleApiError";

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
        <ul className="grid w-full grid-cols-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          {props.data?.map((i) => (
            <li
              key={i.item.id}
              className="rounded-t-lg border-b border-gray-200"
            >
              <div className="flex">
                <div className="flex items-center ps-3">
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
                </div>
                <div className="py-1">
                  <label
                    htmlFor={i.item.id}
                    className="ms-2 w-full text-sm font-medium text-gray-900 dark:text-gray-300"
                  >
                    {i.item.label}
                  </label>
                  <p
                    id="helper-checkbox-text"
                    className="ms-2 text-xs font-normal text-gray-500 dark:text-gray-300"
                  >
                    {i.item.inStock} in stock
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
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
            className="flex items-center justify-between rounded-lg bg-slate-50 p-2 shadow-lg"
          >
            <div>
              <div className="font-semibold text-slate-800">{i.item.label}</div>
              <div className="text-sm text-slate-500">
                {i.item.inStock} in stock
              </div>
            </div>
            {watchAll[i.item.id] !== undefined && watchAll[i.item.id]! > 0 && (
              <div className="text-sm font-semibold text-green-700">
                {"=>"} {i.item.inStock! + watchAll[i.item.id]!} in stock
              </div>
            )}
            <div>
              Amount restocking:{" "}
              <input
                id={i.item.id}
                className="input input-bordered"
                type="number"
                {...register(i.item.id, {
                  required: true,
                  valueAsNumber: true,
                })}
              />
            </div>
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

export default function RestockPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const { data, isLoading } = api.items.getAll.useQuery({
    category: "concession",
  });
  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } = api.items.restockItems.useMutation({
    onSuccess: (x) => {
      void ctx.items.getAll.invalidate();
      setSelected([]);
      toast(x.message);
    },
    onError: handleApiError,
  });

  return (
    <>
      <Head>
        <title>GS: Restock</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
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
            <div role="alert" className="alert mt-2">
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
              <span>Select items to restock</span>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
