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
      <td>
        {item.purchasePrice ? dbUnitToDollars(item.purchasePrice) : "N/A"}
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
            <th>Purchase Price</th>
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
      <div className="flex flex-row justify-center p-2">
        <Link className="btn btn-sm" href="items/0">
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Item
        </Link>
      </div>
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
          <details className="dropdown dropdown-end">
            <summary className="btn btn-circle btn-ghost m-1">
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
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
              </svg>
            </summary>
            <ul className="menu dropdown-content z-[1] w-max rounded-box bg-base-200 p-2 shadow-xl">
              <li>
                <Link href="items/restock">
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
                      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                    />
                  </svg>
                  Restock
                </Link>
              </li>
              <li>
                <Link href="items/0">
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  New Item
                </Link>
              </li>
            </ul>
          </details>
        </div>
        <ItemList filter={filter} category={itemType} />
      </div>
    </PageLayout>
  );
}

export default isAuth(ItemsPage, "admin");
