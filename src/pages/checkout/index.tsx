import { useState } from "react";
import { Button } from "~/components/button";
import { PageLayout } from "~/components/layout";
import { LoadingSpinner } from "~/components/loading";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import { type RouterOutputs, api } from "~/utils/api";

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
          <div className="overflow-clip text-sky-900">{item.label}</div>
          <div className="self-end text-green-600">
            {dbUnitToDollars(item.sellingPrice)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function CheckoutPage() {
  const [feed, setFeed] = useState<"concession" | "admission">("admission");
  // todo use cart data for mutation
  const [cart, setCart] = useState<Item[]>([]);

  return (
    <PageLayout>
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
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
        <div className="col-span-1 row-span-1 border-4 border-blue-500">
          sec 2
        </div>
        <div className="col-span-1 row-span-1 border-4 border-green-500">
          Cart
          {cart.map((i) => (
            <div key={i.id}>{i.label}</div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
