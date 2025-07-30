import { useState } from "react";
import { LoadingPage } from "~/components/loading";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import NoData from "~/components/noData";
import isAuth from "~/components/isAuth";
import { InlineItemEdit } from "~/components/inlineItemEdit";
import CategoryManager from "~/components/categoryManager";

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

const ItemView = (props: {
  item: ItemWithCreatedBy;
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
}) => {
  const { item, editingItemId, setEditingItemId } = props;
  const isEditing = editingItemId === item.item.id;

  const handleEdit = () => {
    setEditingItemId(item.item.id);
  };

  const handleSave = () => {
    setEditingItemId(null);
  };

  const handleCancel = () => {
    setEditingItemId(null);
  };

  if (isEditing) {
    return (
      <tr>
        <InlineItemEdit
          item={item}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </tr>
    );
  }

  // Calculate profit margin for enterprise view
  const profitMargin = item.item.purchasePrice
    ? (
        ((item.item.sellingPrice - item.item.purchasePrice) /
          item.item.sellingPrice) *
        100
      ).toFixed(1)
    : null;

  // Stock status for visual indicators
  const getStockStatus = () => {
    if (!item.item.isConcessionItem) return null;
    const stock = item.item.inStock ?? 0;
    if (stock === 0)
      return { status: "out", color: "text-error", bg: "bg-error/10" };
    if (stock <= 10)
      return { status: "low", color: "text-warning", bg: "bg-warning/10" };
    return { status: "good", color: "text-success", bg: "bg-success/10" };
  };

  const stockStatus = getStockStatus();

  return (
    <tr className="transition-colors hover:bg-base-200/50">
      <td className="font-semibold text-base-content">{item.item.label}</td>
      <td>
        <div className="flex flex-col gap-1">
          <div
            className={`badge ${
              item.item.isConcessionItem ? "badge-primary" : "badge-secondary"
            } badge-sm`}
          >
            {item.item.isConcessionItem ? "Concession" : "Admission"}
          </div>
          {item.item.isConcessionItem && item.item.category && (
            <div className="badge badge-outline badge-xs">
              {item.item.category}
            </div>
          )}
          {item.item.isConcessionItem && !item.item.category && (
            <div className="badge badge-ghost badge-xs text-warning">
              No category
            </div>
          )}
        </div>
      </td>
      <td className="font-mono text-sm">
        {item.item.purchasePrice ? (
          dbUnitToDollars(item.item.purchasePrice)
        ) : (
          <span className="text-base-content/50">—</span>
        )}
      </td>
      <td className="font-mono text-sm font-semibold">
        {dbUnitToDollars(item.item.sellingPrice)}
      </td>
      <td>
        {profitMargin && (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm ${
                parseFloat(profitMargin) > 50
                  ? "text-success"
                  : parseFloat(profitMargin) > 20
                  ? "text-warning"
                  : "text-error"
              }`}
            >
              {profitMargin}%
            </span>
          </div>
        )}
      </td>
      <td>
        {item.item.isConcessionItem ? (
          <div className="flex items-center gap-2">
            {stockStatus && (
              <div
                className={`rounded-full px-2 py-1 text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}
              >
                {item.item.inStock ?? 0} units
              </div>
            )}
          </div>
        ) : item.item.isDay ? (
          <div className="badge badge-secondary badge-sm">Day Pass</div>
        ) : (
          <div className="badge badge-accent badge-sm">Season Pass</div>
        )}
      </td>
      <td>
        <div className="flex items-center gap-1">
          <button
            onClick={handleEdit}
            className="btn btn-ghost btn-xs hover:btn-primary"
            title="Edit item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

const ItemList = (props: {
  filter: string;
  category?: "concession" | "admission";
  editingItemId: string | null;
  setEditingItemId: (id: string | null) => void;
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

  // Calculate summary statistics
  const totalItems = filterItems.length;
  const totalValue = filterItems.reduce((sum, item) => {
    if (
      item.item.isConcessionItem &&
      item.item.purchasePrice &&
      item.item.inStock
    ) {
      return sum + item.item.purchasePrice * item.item.inStock;
    }
    return sum;
  }, 0);

  const lowStockItems = filterItems.filter(
    (item) =>
      item.item.isConcessionItem &&
      (item.item.inStock ?? 0) <= 10 &&
      (item.item.inStock ?? 0) > 0,
  ).length;

  const outOfStockItems = filterItems.filter(
    (item) => item.item.isConcessionItem && (item.item.inStock ?? 0) === 0,
  ).length;

  return (
    <div className="h-full space-y-4">
      {/* Summary Statistics */}
      {props.category === "concession" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-xs">Total Items</div>
            <div className="stat-value text-2xl">{totalItems}</div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-xs">Inventory Value</div>
            <div className="stat-value text-2xl">
              {dbUnitToDollars(totalValue)}
            </div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-xs">Low Stock</div>
            <div className="stat-value text-2xl text-warning">
              {lowStockItems}
            </div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-xs">Out of Stock</div>
            <div className="stat-value text-2xl text-error">
              {outOfStockItems}
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead className="bg-base-200">
                <tr>
                  <th className="font-semibold">Item Name</th>
                  <th className="font-semibold">Category</th>
                  <th className="font-semibold">Cost</th>
                  <th className="font-semibold">Price</th>
                  <th className="font-semibold">Margin</th>
                  <th className="font-semibold">
                    {props.category === "concession"
                      ? "Stock Level"
                      : "Pass Type"}
                  </th>
                  <th className="font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filterItems.map((itemWithCreator) => (
                  <ItemView
                    key={itemWithCreator.item.id}
                    item={itemWithCreator}
                    editingItemId={props.editingItemId}
                    setEditingItemId={props.setEditingItemId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  api.items.getAll.useQuery();

  return (
    <PageLayout>
      <div className="flex h-full w-full flex-col gap-8">
        {/* Header Section */}
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-base-content">
              Inventory Management
            </h1>
            <p className="text-base text-base-content/70">
              Manage your {itemType} items, track stock levels, and monitor
              profitability
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div role="tablist" className="tabs-boxed tabs">
                <a
                  role="tab"
                  className={`tab ${itemType === "concession" && "tab-active"}`}
                  onClick={() => setItemType("concession")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0 0 20.25 8.734V21"
                    />
                  </svg>
                  Concessions
                </a>
                <a
                  role="tab"
                  className={`tab ${itemType === "admission" && "tab-active"}`}
                  onClick={() => setItemType("admission")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                    />
                  </svg>
                  Admissions
                </a>
              </div>

              <label
                htmlFor="item-filter"
                className="input input-bordered flex w-full items-center gap-2 sm:w-80"
              >
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
                <input
                  id="item-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  type="text"
                  className="grow"
                  placeholder="Search inventory..."
                />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="items/restock" className="btn btn-outline btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
                Bulk Restock
              </Link>
              <Link href="items/0" className="btn btn-primary btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add New Item
              </Link>
            </div>
          </div>
        </div>

        {/* Category Management Section - Only for Concession Items */}
        {itemType === "concession" && (
          <CategoryManager
            onCategoryUpdate={() => {
              // Refetch data when categories are updated
              api.items.getAll.useQuery();
            }}
          />
        )}

        <ItemList
          filter={filter}
          category={itemType}
          editingItemId={editingItemId}
          setEditingItemId={setEditingItemId}
        />
      </div>
    </PageLayout>
  );
}

export default isAuth(ItemsPage, "admin");
