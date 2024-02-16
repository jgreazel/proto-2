import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "~/components/button";
import { PageLayout } from "~/components/layout";
import { LoadingSpinner } from "~/components/loading";
import { getStartOfDay, getEndOfDay } from "~/helpers/dateHelpers";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
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
    <div className="grid grid-cols-2 gap-3 p-3">
      {data?.map(({ item }) => (
        <div
          onClick={() => props.onClick(item)}
          className="flex flex-col justify-between rounded-md bg-slate-50 p-2 shadow-lg hover:cursor-pointer hover:shadow-2xl"
          key={item.id}
        >
          <div className="overflow-clip text-sm font-medium text-sky-900">
            {item.label}
          </div>
          <div className="self-end text-green-600">
            {dbUnitToDollars(item.sellingPrice)}
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
    <>
      <h2 className="font-semibold">Admit Season Pass Holders:</h2>
      <div className="grid h-full grid-cols-1 gap-2 overflow-y-scroll">
        {passesData?.map(({ label, patrons, id }) => (
          <div
            className="flex flex-col justify-between rounded-xl bg-slate-50 p-2 shadow-lg"
            key={id}
          >
            <div className="text-sm font-medium text-sky-900">
              {label}
              <div className="flex flex-col gap-1">
                {patrons.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between rounded-xl bg-slate-50 p-2 shadow-md"
                  >
                    <div className="font-normal">
                      {`${p.firstName} ${p.lastName}`}
                    </div>

                    {eventData?.find((e) => e.patronId === p.id) ? (
                      <></>
                    ) : (
                      <span
                        onClick={() => onClick(p)}
                        className="text-sm font-thin hover:cursor-pointer hover:underline"
                      >
                        Admit
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default function CheckoutPage() {
  const [feed, setFeed] = useState<"concession" | "admission">("admission");
  const [cart, setCart] = useState<Item[]>([]);
  const { mutate, isLoading } = api.items.checkout.useMutation({
    onError: (d) => {
      toast.error(d.message);
    },
    onSuccess: (r) => {
      setCart([]);
      toast.success(r.message);
    },
  });

  return (
    <PageLayout>
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-4 overflow-hidden">
        <div className="col-span-1 row-span-2 rounded-lg bg-slate-50 p-2 shadow-lg">
          <Button
            onClick={() => {
              setFeed((prev) => {
                if (prev === "concession") return "admission";
                else return "concession";
              });
            }}
          >
            Switch Items
          </Button>
          <ItemFeed
            onClick={(data) => {
              setCart((prev) => [...prev, data]);
            }}
            category={feed}
          />
        </div>
        <div className="border-lg col-span-1 row-span-1 overflow-hidden rounded-lg bg-slate-50 p-1 shadow-lg">
          <AdmissionFeed />
        </div>
        <div className="col-span-1 row-span-1 flex h-full flex-col gap-2 rounded-lg bg-slate-50 p-2 shadow-lg">
          <div className="font-semibold">Cart</div>
          <div className="flex h-full flex-col gap-2 overflow-y-scroll">
            {cart.map((i, idx) => (
              <div
                className="text-small flex w-full justify-between rounded-full bg-slate-50 p-1 px-3 text-slate-600 shadow-lg"
                key={`${i.id}-${idx}`}
              >
                {i.label}
                <span
                  onClick={() => {
                    const copy = [...cart];
                    copy.splice(idx, 1);
                    setCart(copy);
                  }}
                  className="text-xs text-red-400 hover:cursor-pointer hover:underline"
                >
                  Remove
                </span>
              </div>
            ))}
          </div>
          <div className="flex flex-row justify-end gap-2">
            <Button
              disabled={!cart.length}
              onClick={() => {
                setCart([]);
              }}
            >
              Empty
            </Button>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Button
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
      </div>
    </PageLayout>
  );
}
