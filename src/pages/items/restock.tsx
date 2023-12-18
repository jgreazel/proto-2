import { SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { api } from "~/utils/api";

const SelectionHeader = (props: {
  value: string[];
  setValue: (arg: (prev: string[]) => string[]) => void;
}) => {
  const { data, isLoading } = api.items.getAll.useQuery({
    category: "concession",
  });

  return (
    <>
      <div className="p-4">Which items are you restocking today?</div>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <ul className="grid w-full grid-cols-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          {data?.map((i) => (
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
                    className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600 dark:ring-offset-gray-700 dark:focus:ring-blue-600 dark:focus:ring-offset-gray-700"
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

export default function RestockPage() {
  const [selected, setSelected] = useState<string[]>([]);
  // todo: new wizard (with mutation) and form (with form hooks) made from selected's value. dont branch out until need to
  return (
    <>
      <Head>
        <title>GS: Restock</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <SelectionHeader value={selected} setValue={setSelected} />
        </div>
      </main>
    </>
  );
}
