import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/button";
import { PageLayout } from "~/components/layout";
import { LoadingSpinner } from "~/components/loading";
import { getStartOfDay, getEndOfDay } from "~/helpers/dateHelpers";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import filterPasses from "~/helpers/filterPasses";
import handleApiError from "~/helpers/handleApiError";
import { type RouterOutputs, api, type RouterInputs } from "~/utils/api";

type Item = RouterOutputs["items"]["getAll"][number]["item"];

const ItemFeed = (props: {
  category: "admission" | "concession";
  onClick: (data: Item) => void;
}) => {
  const { data, isLoading } = api.items.getAll.useQuery({
    category: props.category,
  });
  if (isLoading)
    return (
      <div className="my-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {data?.map(({ item }) => (
        <button
          onClick={() => props.onClick(item)}
          key={item.id}
          className="btn capitalize"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

type Patron = RouterOutputs["passes"]["getAll"][number]["patrons"][number];

const AdmissionFeed = () => {
  const { data: passesData, isLoading: isFetchingPasses } =
    api.passes.getAll.useQuery();
  const today = new Date();
  const {
    data: eventData,
    isLoading: isFetchingEvents,
    refetch,
  } = api.passes.getAdmissions.useQuery({
    range: [getStartOfDay(today), getEndOfDay(today)],
  });
  const { mutate, isLoading: isCreating } = api.passes.admitPatron.useMutation({
    onSuccess: async (data) => {
      toast.success(`${data.patron.firstName} successfully admitted!`);
      await refetch();
    },
    onError: handleApiError,
  });
  const [filter, setFilter] = useState("");

  const onClick = (data: Patron) => {
    if (isCreating) return;
    mutate({ patronId: data.id });
  };

  if (isFetchingPasses || isFetchingEvents)
    return (
      <div className="my-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  return (
    <div className="p-2">
      <label
        htmlFor="pass-filter"
        className="input input-bordered m-1 flex items-center gap-2"
      >
        <input
          id="pass-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          type="text"
          className="grow"
          placeholder="Search"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-4 w-4 opacity-70"
        >
          <path
            fillRule="evenodd"
            d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
            clipRule="evenodd"
          />
        </svg>
      </label>

      {passesData
        ?.filter((p) => filterPasses(p, filter))
        .map(({ label, patrons, id }) => (
          <div className="p-1" key={id}>
            <div className="badge badge-outline"> {label}</div>

            {patrons.map((p) => (
              <div
                className="flex-base my-1 flex items-center justify-between rounded-lg bg-base-100 p-2 shadow-xl"
                key={p.id}
              >
                <div className="font-medium capitalize">{`${p.firstName} ${p.lastName}`}</div>
                <div className="">
                  {eventData?.find((e) => e.patronId === p.id) ? (
                    <></>
                  ) : (
                    <div className="tooltip tooltip-left" data-tip="Admit">
                      <button
                        className="btn btn-circle btn-ghost btn-sm"
                        onClick={() => onClick(p)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-6 w-6 rotate-180"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

export default function CheckoutPage() {
  const [feed, setFeed] = useState<"concession" | "admission" | "passes">(
    "concession",
  );
  const [cart, setCart] = useState<Item[]>([]);
  const cartTotal = cart.reduce((acc, x) => (acc += x.sellingPrice), 0);
  const { mutate, isLoading } = api.items.checkout.useMutation({
    onError: (d) => {
      toast.error(d.message);
    },
    onSuccess: (r) => {
      setCart([]);
      toast.success(`${r.message} Collect ${dbUnitToDollars(r.total)}`, {
        duration: 5000,
      });
      if (r.action) {
        toast(
          (t) => (
            <span className="flex flex-row items-center justify-between gap-2">
              <button
                className="btn btn-circle btn-sm"
                onClick={() => toast.dismiss(t.id)}
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
              </button>
              Action Required: {r.action?.message}
              <Link
                className="btn btn-square btn-primary btn-sm"
                href={r.action?.href ?? ""}
              >
                Go
              </Link>
            </span>
          ),
          {
            duration: Infinity,
          },
        );
      }
    },
  });

  const shoppingList = (
    <>
      <div role="tablist" className="tabs-boxed tabs">
        <a
          role="tab"
          className={`tab ${feed === "concession" && "tab-active"}`}
          onClick={() => setFeed("concession")}
        >
          Concession
        </a>
        <a
          role="tab"
          className={`tab ${feed === "admission" && "tab-active"}`}
          onClick={() => setFeed("admission")}
        >
          Admission
        </a>
        <a
          role="tab"
          className={`tab ${feed === "passes" && "tab-active"}`}
          onClick={() => setFeed("passes")}
        >
          Patrons
        </a>
      </div>
      {feed === "passes" ? (
        <AdmissionFeed />
      ) : (
        <ItemFeed
          onClick={(data) => {
            setCart((prev) => [...prev, data]);
          }}
          category={feed}
        />
      )}
    </>
  );

  return (
    <PageLayout>
      <div className="flex flex-col gap-2 md:flex-row">
        <div className="hidden p-2 md:block md:w-2/3">{shoppingList}</div>
        <div className="p-2 md:w-1/3">
          <div className="rounded-lg bg-base-100 p-2 shadow-xl">
            <div className="flex flex-row items-center gap-1 p-2 text-xl font-medium">
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
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                />
              </svg>
              Cart
            </div>
            {cart.map((i, idx) => (
              <div
                className="my-1 flex flex-row items-center justify-between rounded-lg bg-base-100 p-2 shadow-xl"
                key={`${i.id}-${idx}`}
              >
                <div className="flex flex-col">
                  <div className="font-medium">{i.label}</div>
                  <div className="text-sm">
                    {dbUnitToDollars(i.sellingPrice)}
                  </div>
                </div>
                <div className="tooltip tooltip-left" data-tip="Remove">
                  <button
                    className="btn btn-circle btn-ghost btn-sm"
                    onClick={() => {
                      const copy = [...cart];
                      copy.splice(idx, 1);
                      setCart(copy);
                    }}
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
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div
              id="section-footer"
              className="flex flex-row justify-end gap-2 p-2"
            >
              <button
                className="btn btn-ghost"
                disabled={!cart.length}
                onClick={() => {
                  setCart([]);
                }}
              >
                Empty
              </button>
              {isLoading ? (
                <LoadingSpinner />
              ) : (
                <Button
                  primary
                  disabled={!cart.length}
                  onClick={() => {
                    const uniq = new Set(cart.map((c) => c.id));
                    let input: RouterInputs["items"]["checkout"];
                    uniq.forEach((x) => {
                      const toAdd = {
                        id: x,
                        amountSold: cart.filter((c) => c.id === x).length,
                      };

                      if (!input) {
                        input = [toAdd];
                      } else {
                        input.push(toAdd);
                      }
                    });
                    mutate(input!);
                  }}
                >
                  Checkout: {dbUnitToDollars(cartTotal)}
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="block p-2 md:hidden">{shoppingList}</div>
      </div>
    </PageLayout>
  );
}
