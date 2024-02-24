import { useState } from "react";
import { LoadingPage } from "~/components/loading";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

const ItemView = (props: { item: ItemWithCreatedBy }) => {
  const { item, createdBy } = props.item;

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
        <div>Selling Price: {dbUnitToDollars(item.sellingPrice)}</div>
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
    <div className="flex h-full w-full flex-col gap-3 overflow-y-scroll py-3">
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

export default function ItemsPage() {
  const [filter, setFilter] = useState("");
  const [itemType, setItemType] = useState<"concession" | "admission">(
    "concession",
  );

  api.items.getAll.useQuery();

  return (
    <PageLayout
      actionRow={
        <div className="flex justify-end gap-2">
          {itemType === "concession" && (
            <Button href="items/restock">Restock</Button>
          )}
          <Button href="items/0">New Item</Button>
        </div>
      }
    >
      <div className="gap flex h-full w-full flex-col items-start">
        <div className="flex w-full items-center gap-2 p-2">
          <div role="tablist" className="tabs-boxed tabs">
            <a
              role="tab"
              className={`tab ${itemType === "concession" && "tab-active"}`}
              onClick={() => setItemType("concession")}
            >
              Concession
            </a>
            <a
              role="tab"
              className={`tab ${itemType === "admission" && "tab-active"}`}
              onClick={() => setItemType("admission")}
            >
              Admission
            </a>
          </div>
          <label className="text-s font-medium">Filter:</label>
          <input
            className="input input-bordered grow"
            placeholder=""
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <ItemList filter={filter} category={itemType} />
      </div>
    </PageLayout>
  );
}
