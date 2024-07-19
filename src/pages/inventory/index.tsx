import { useState } from "react";
import { LoadingPage } from "~/components/loading";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import NoData from "~/components/noData";
import isAuth from "~/components/isAuth";

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

const ItemView = (props: { item: ItemWithCreatedBy }) => {
  const { item } = props.item;

  return (
    <tr>
      <td className="font-medium">{item.label}</td>
      <td>
        <div className="badge badge-outline">
          {item.isConcessionItem ? "Concession" : "Admission"}
        </div>
      </td>
      <td>{dbUnitToDollars(item.sellingPrice)}</td>
      <td>
        {item.isConcessionItem ? (
          item.inStock
        ) : item.isDay ? (
          <div className="badge badge-secondary badge-outline">Day</div>
        ) : (
          <div className="badge badge-accent badge-outline">Seasonal</div>
        )}
      </td>
      <td>
        <Link
          href={`/inventory/${item.id}`}
          className="btn btn-circle btn-ghost btn-sm"
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
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
            />
          </svg>
        </Link>
      </td>
    </tr>
  );
};

const ItemList = (props: {
  filter: string;
  category?: "concession" | "admission";
}) => {
  const { data, isLoading } = api.items.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  const filterItems = data.filter(
    (d) =>
      d.item.label.toUpperCase().includes(props.filter.toUpperCase()) &&
      ((d.item.isAdmissionItem && props.category === "admission") ||
        (d.item.isConcessionItem && props.category === "concession")),
  );

  return (
    <div className="h-full">
      <table className="table table-zebra shadow-lg">
        <thead>
          <tr>
            <th>Label</th>
            <th>Category</th>
            <th>Selling Price</th>
            <th>{props.category === "concession" ? "In Stock" : "Type"}</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          {filterItems.map((itemWithCreator) => (
            <ItemView key={itemWithCreator.item.id} item={itemWithCreator} />
          ))}
        </tbody>
      </table>
      {!filterItems.length && (
        <div className="p-12">
          <NoData />
          <div className="mt-8 text-center font-medium">No Items Yet</div>
        </div>
      )}
    </div>
  );
};

function ItemsPage() {
  const [filter, setFilter] = useState("");
  const [itemType, setItemType] = useState<"concession" | "admission">(
    "concession",
  );

  api.items.getAll.useQuery();

  return (
    <PageLayout>
      <div className="gap flex h-full w-full flex-col justify-between">
        <div className="flex w-full flex-row items-center justify-between gap-2 p-2">
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

          <label
            htmlFor="item-filter"
            className="input input-bordered m-1 flex grow items-center gap-2"
          >
            <input
              id="item-filter"
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
        </div>
        <ItemList filter={filter} category={itemType} />
      </div>
    </PageLayout>
  );
}

export default isAuth(ItemsPage, "admin");
