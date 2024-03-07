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

// might still use this w/ tooltip
// const getInitials = (str: string) =>
//   str.split(" ").reduce((acc, x) => acc + x[0], "");

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
    <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-3">
      {data?.map(({ item }) => (
        <div className="card card-compact bg-base-200 shadow-xl" key={item.id}>
          <div className="card-body justify-between">
            <div className="font-medium md:card-title">{item.label}</div>
            <div className="card-actions justify-end">
              <button
                onClick={() => props.onClick(item)}
                className="btn btn-secondary btn-sm md:btn-md"
              >
                {dbUnitToDollars(item.sellingPrice)}
              </button>
            </div>
          </div>
        </div>
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
    <div className="collapse collapse-arrow h-min bg-base-200 shadow-xl">
      <input type="checkbox" />
      <div className="collapse-title text-xl font-medium">
        Admit Season Pass Holders
      </div>
      <div className="collapse-content">
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
                  key={p.id}
                  className="card card-side card-compact my-1 bg-base-100 shadow-xl"
                >
                  <div className="card-title p-4">{`${p.firstName} ${p.lastName}`}</div>
                  <div className="card-body">
                    <div className="card-actions justify-end">
                      {eventData?.find((e) => e.patronId === p.id) ? (
                        <></>
                      ) : (
                        <button
                          className="btn btn-square btn-outline btn-primary btn-sm"
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
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
};

export default function CheckoutPage() {
  const [feed, setFeed] = useState<"concession" | "admission">("concession");
  const [cart, setCart] = useState<Item[]>([]);
  const cartTotal = cart.reduce((acc, x) => (acc += x.sellingPrice), 0);
  const { mutate, isLoading } = api.items.checkout.useMutation({
    onError: (d) => {
      toast.error(d.message);
    },
    onSuccess: (r) => {
      setCart([]);
      toast.success(r.message);
      if (r.action) {
        toast(
          (t) => (
            <span className="flex flex-row justify-between">
              Action Required: {r.action}
              <Button onClick={() => toast.dismiss(t.id)}>X</Button>
            </span>
          ),
          {
            duration: Infinity,
          },
        );
      }
    },
  });

  return (
    <PageLayout>
      <div className="flex flex-row gap-2">
        <div className="w-1/2 p-2">
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
          </div>
          <ItemFeed
            onClick={(data) => {
              setCart((prev) => [...prev, data]);
            }}
            category={feed}
          />
        </div>
        <div className="w-1/2 p-2">
          <div className="collapse collapse-arrow h-min bg-base-200 shadow-xl">
            <input type="checkbox" defaultChecked />

            <div className="collapse-title text-xl font-medium">
              Cart - {dbUnitToDollars(cartTotal)}
            </div>

            <div className="collapse-content">
              {cart.map((i, idx) => (
                <div
                  className="card card-side card-compact my-1 bg-base-100 shadow-xl"
                  key={`${i.id}-${idx}`}
                >
                  <div className="p-4 font-medium md:card-title">{i.label}</div>
                  <div className="card-body">
                    <div className="card-actions justify-end">
                      <button
                        className="btn btn-square btn-outline btn-secondary btn-sm"
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
                </div>
              ))}
            </div>
            <div
              id="section-footer"
              className="flex flex-row justify-end gap-2 p-4"
            >
              <button
                className="btn btn-outline btn-secondary bg-base-100"
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
                  Checkout
                </Button>
              )}
            </div>
          </div>
          <div className="h-4" />
          <AdmissionFeed />
        </div>
      </div>
    </PageLayout>
  );
}
