import { useState } from "react";
import { LoadingPage } from "~/components/loading";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";

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
          href={`/items/${item.id}`}
          className="btn btn-square btn-outline btn-primary btn-sm"
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

  return (
    <div className="h-full">
      <table className="table table-zebra">
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
          {data
            .filter(
              (d) =>
                d.item.label
                  .toUpperCase()
                  .includes(props.filter.toUpperCase()) &&
                ((d.item.isAdmissionItem && props.category === "admission") ||
                  (d.item.isConcessionItem && props.category === "concession")),
            )
            .map((itemWithCreator) => (
              <ItemView key={itemWithCreator.item.id} item={itemWithCreator} />
            ))}
        </tbody>
      </table>
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
          <details className="dropdown dropdown-end">
            <summary className="btn m-1">
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
                  d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
                />
              </svg>
              Actions
            </summary>
            <ul className="menu dropdown-content z-[1] w-max rounded-box bg-base-200 p-2 shadow-xl">
              <li>
                <Link href="items/restock">Restock</Link>
              </li>
              <li>
                <Link href="items/0">New Item</Link>
              </li>
            </ul>
          </details>
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
