import { SignOutButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

const ItemView = (props: { item: ItemWithCreatedBy }) => {
  const { item, createdBy } = props.item;

  const usDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="rounded-lg bg-slate-50 p-6 shadow-lg" key={item.id}>
      <div className="flex flex-row items-baseline gap-2">
        <Link
          href={`/items/${item.id}`}
          className="font-medium hover:underline"
        >
          {item.label}
        </Link>
        <div className="text-xs capitalize italic text-slate-400">
          Last edit:{" "}
          <Link className="hover:underline" href={`/@${createdBy.username}`}>
            @{createdBy.username}
          </Link>{" "}
          - {item.createdAt.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div>
          Category: {item.isConcessionItem ? "Concession" : "Admission"}
        </div>
        <div>Selling Price: {usDollar.format(item.sellingPrice / 100)}</div>
        {item.isConcessionItem ? (
          <div>In Stock: {item.inStock}</div>
        ) : (
          <div>Type: {item.isDay ? "Day" : "Seasonal"}</div>
        )}
      </div>
    </div>
  );
};

const ItemList = (props: {
  filter: string;
  category?: "concession" | "admission";
}) => {
  const { data, isLoading } = api.items.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-scroll py-3">
      {data
        .filter(
          (d) =>
            d.item.label.toUpperCase().includes(props.filter.toUpperCase()) &&
            ((d.item.isAdmissionItem && props.category === "admission") ||
              (d.item.isConcessionItem && props.category === "concession")),
        )
        .map((itemWithCreator) => (
          <ItemView key={itemWithCreator.item.id} item={itemWithCreator} />
        ))}
    </div>
  );
};

export default function Home() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  const [filter, setFilter] = useState("");
  const [itemType, setItemType] = useState<"concession" | "admission">(
    "concession",
  );

  api.items.getAll.useQuery();

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  return (
    <PageLayout>
      <div className="gap grid-auto-rows grid h-screen overflow-y-clip">
        <div className="p-4">
          {!!isSignedIn && (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between font-semibold">
                <div className="capitalize">Hi, {user.username}</div>
                <SignOutButton />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 p-2">
          <Button
            onClick={() =>
              setItemType((prev) => {
                if (prev === "concession") return "admission";
                else return "concession";
              })
            }
          >
            Toggle (viewing {itemType})
          </Button>
          <label className="text-s font-medium">Filter:</label>
          <input
            className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
            placeholder=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <ItemList filter={filter} category={itemType} />
        <div className="flex justify-end gap-2 p-3">
          <Button href="items/shipment">Shipment</Button>
          <Button href="items/0">New Item</Button>
        </div>
      </div>
    </PageLayout>
  );
}
