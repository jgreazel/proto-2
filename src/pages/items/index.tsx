import { useState } from "react";
import { LoadingPage } from "~/components/loading";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import NoData from "~/components/noData";
import isAuth from "~/components/isAuth";
import { InlineItemEdit } from "~/components/inlineItemEdit";
import handleApiError from "~/helpers/handleApiError";
import {
  AdmissionItemForm,
  ConcessionItemForm,
} from "~/pages/items/[id]";

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
            } badge`}
          >
            {item.item.isConcessionItem ? "Concession" : "Admission"}
          </div>
          {item.item.isConcessionItem && item.item.category && (
            <div className="badge badge-outline badge-sm">
              {item.item.category}
            </div>
          )}
          {item.item.isConcessionItem && !item.item.category && (
            <div className="badge badge-ghost badge-sm text-base-content/60">
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
                className={`rounded-full px-3 py-1 text-sm font-medium ${stockStatus.bg} ${stockStatus.color}`}
              >
                {item.item.inStock ?? 0} units
              </div>
            )}
          </div>
        ) : item.item.isDay ? (
          <div className="badge badge-secondary">Day Pass</div>
        ) : (
          <div className="badge badge-accent">Season Pass</div>
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data, isLoading } = api.items.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  // Filter by item type and search text first
  const typeFiltered = data.filter(
    (d) =>
      d.item.label.toUpperCase().includes(props.filter.toUpperCase()) &&
      ((d.item.isAdmissionItem && props.category === "admission") ||
        (d.item.isConcessionItem && props.category === "concession")),
  );

  // Build category list with counts (concession only)
  const categoryMap = new Map<string, number>();
  let uncategorizedCount = 0;
  if (props.category === "concession") {
    for (const d of typeFiltered) {
      const cat = d.item.category;
      if (cat) {
        categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
      } else {
        uncategorizedCount++;
      }
    }
  }
  const categories = Array.from(categoryMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  // Apply category filter
  const filterItems =
    props.category === "concession" && selectedCategory !== null
      ? selectedCategory === ""
        ? typeFiltered.filter((d) => !d.item.category)
        : typeFiltered.filter((d) => d.item.category === selectedCategory)
      : typeFiltered;

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
            <div className="stat-title text-sm">Total Items</div>
            <div className="stat-value text-2xl">{totalItems}</div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-sm">Inventory Value</div>
            <div className="stat-value text-2xl">
              {dbUnitToDollars(totalValue)}
            </div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-sm">Low Stock</div>
            <div className="stat-value text-2xl text-warning">
              {lowStockItems}
            </div>
          </div>
          <div className="stat rounded-lg bg-base-100 shadow-lg">
            <div className="stat-title text-sm">Out of Stock</div>
            <div className="stat-value text-2xl text-error">
              {outOfStockItems}
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      {props.category === "concession" && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-base-content/50">Filter:</span>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`badge cursor-pointer transition-colors ${
              selectedCategory === null
                ? "badge-primary text-primary-content"
                : "badge-outline hover:bg-primary/20"
            }`}
          >
            All ({typeFiltered.length})
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() =>
                setSelectedCategory(selectedCategory === cat ? null : cat)
              }
              className={`badge cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? "badge-primary text-primary-content"
                  : "badge-outline hover:bg-primary/20"
              }`}
            >
              {cat} ({count})
            </button>
          ))}
          {uncategorizedCount > 0 && (
            <button
              onClick={() =>
                setSelectedCategory(selectedCategory === "" ? null : "")
              }
              className={`badge cursor-pointer transition-colors ${
                selectedCategory === ""
                  ? "badge-warning text-warning-content"
                  : "badge-ghost hover:bg-warning/20"
              }`}
            >
              Uncategorized ({uncategorizedCount})
            </button>
          )}
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

// === Drawer Components (same pattern as register page) ===

const NewItemDrawer = ({ onClose }: { onClose: () => void }) => {
  const ctx = api.useUtils();
  const [tab, setTab] = useState<"admission" | "concession">("concession");

  const { mutate: concessionMutation, isLoading: isCreating } =
    api.items.createConcessionItem.useMutation({
      onSuccess: () => {
        void ctx.items.getAll.invalidate();
        toast.success("Item Created!");
        onClose();
      },
      onError: handleApiError,
    });
  const { mutate: admissionMutation, isLoading: isCreatingA } =
    api.items.createAdmissionItem.useMutation({
      onSuccess: () => {
        void ctx.items.getAll.invalidate();
        toast.success("Item Created!");
        onClose();
      },
      onError: handleApiError,
    });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <h2 className="font-semibold">Add New Item</h2>
          </div>
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-1 rounded-lg bg-base-200 p-1">
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "concession" ? "bg-primary text-white shadow-sm" : "text-base-content hover:bg-base-300"}`}
                onClick={() => setTab("concession")}
              >
                Concession
              </button>
              <button
                type="button"
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === "admission" ? "bg-primary text-white shadow-sm" : "text-base-content hover:bg-base-300"}`}
                onClick={() => setTab("admission")}
              >
                Admission
              </button>
            </div>
            {tab === "admission" ? (
              <AdmissionItemForm
                isLoading={false}
                isSubmitting={isCreatingA}
                onSubmit={(data) =>
                  admissionMutation({
                    ...data,
                    isDay: data.passType === "day",
                    isSeasonal: data.passType === "seasonal",
                    patronLimit:
                      data.passType === "seasonal"
                        ? data.patronLimit ?? 1
                        : undefined,
                  })
                }
              />
            ) : (
              <ConcessionItemForm
                isLoading={false}
                isSubmitting={isCreating}
                onSubmit={concessionMutation}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const RestockDrawer = ({ onClose }: { onClose: () => void }) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [changeNote, setChangeNote] = useState("");
  const [filter, setFilter] = useState("");
  const { data, isLoading } = api.items.getAll.useQuery({
    category: "concession",
  });
  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } = api.items.restockItems.useMutation({
    onSuccess: (x) => {
      void ctx.items.getAll.invalidate();
      toast.success(x.message);
      onClose();
    },
    onError: handleApiError,
  });

  const selectedCount = Object.values(quantities).filter((q) => q > 0).length;

  const handleSubmit = () => {
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([id, restockAmount]) => ({ id, restockAmount }));
    if (items.length > 0 && changeNote.trim()) {
      mutate({ items, changeNote });
    }
  };

  const filteredItems = data?.filter((i) =>
    i.item.label.toUpperCase().includes(filter.toUpperCase()),
  );

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-base-300 bg-base-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            <h2 className="font-semibold">Bulk Restock</h2>
            {selectedCount > 0 && (
              <div className="badge badge-primary">
                {selectedCount} item{selectedCount !== 1 && "s"}
              </div>
            )}
          </div>
          <button className="btn btn-circle btn-ghost btn-sm" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-base-200 px-4 py-3">
          <label className="input input-bordered input-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 opacity-50">
              <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
            </svg>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="text"
              className="grow"
              placeholder="Search items…"
            />
          </label>
        </div>

        {/* Item list with inline quantity inputs */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8"><LoadingPage /></div>
          ) : (
            <div className="divide-y divide-base-200">
              {filteredItems?.map((i) => {
                const qty = quantities[i.item.id] ?? 0;
                const stock = i.item.inStock ?? 0;
                return (
                  <div
                    key={i.item.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${qty > 0 ? "bg-primary/5" : "hover:bg-base-200/50"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold" title={i.item.label}>
                        {i.item.label}
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          stock === 0
                            ? "text-error"
                            : stock <= 10
                            ? "text-warning"
                            : "text-success"
                        }`}
                      >
                        {stock} in stock
                        {qty > 0 && (
                          <span className="text-success"> → {stock + qty}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex w-24 shrink-0 items-center gap-1">
                      <span className="text-xs text-base-content/50">+</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={qty || ""}
                        onChange={(e) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [i.item.id]: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="input input-bordered input-sm w-full text-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        {selectedCount > 0 && (
          <div className="border-t border-base-300 bg-base-100 px-4 py-3">
            <textarea
              className="textarea textarea-bordered textarea-sm mb-3 w-full"
              placeholder="Change note (required) — e.g., Weekly delivery, Vendor order #123"
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline btn-sm flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!changeNote.trim() || isUpdating}
                className="btn btn-primary btn-sm flex-1"
              >
                {isUpdating ? "Restocking…" : `Restock ${selectedCount} Item${selectedCount !== 1 ? "s" : ""}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

function ItemsPage() {
  const [filter, setFilter] = useState("");
  const [itemType, setItemType] = useState<"concession" | "admission">(
    "concession",
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showRestock, setShowRestock] = useState(false);

  api.items.getAll.useQuery();

  return (
    <PageLayout>
      <div className="flex h-full w-full flex-col">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary to-accent px-6 py-5 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">
                Inventory Management
              </h1>
              <p className="mt-1 text-sm font-medium text-white/80">
                Manage your {itemType} items, track stock levels, and monitor
                profitability
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowRestock(true)}
                className="btn btn-sm border-white/30 bg-white/25 font-medium text-white hover:bg-white/35"
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
                    d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                  />
                </svg>
                Bulk Restock
              </button>
              <button
                onClick={() => setShowNewItem(true)}
                className="btn btn-sm border-none bg-white text-primary shadow-sm hover:bg-white/90"
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Add New Item
              </button>
            </div>
          </div>

          {/* Controls row — inside the banner */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div role="tablist" className="tabs-boxed tabs bg-black/25">
              <a
                role="tab"
                className={`tab ${itemType === "concession" ? "!bg-white !text-primary font-bold shadow-sm" : "font-medium text-white/90 hover:bg-white/20"}`}
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
                className={`tab ${itemType === "admission" ? "!bg-white !text-primary font-bold shadow-sm" : "font-medium text-white/90 hover:bg-white/20"}`}
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

            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70"
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
                className="input w-full border-white/30 bg-white/25 pl-10 font-medium text-white placeholder:text-white/60 focus:border-white/50 focus:bg-white/35 focus:outline-none"
                placeholder="Search inventory..."
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 p-6">
          <ItemList
            filter={filter}
            category={itemType}
            editingItemId={editingItemId}
            setEditingItemId={setEditingItemId}
          />
        </div>
      </div>

      {/* Drawers */}
      {showNewItem && (
        <NewItemDrawer onClose={() => setShowNewItem(false)} />
      )}
      {showRestock && (
        <RestockDrawer onClose={() => setShowRestock(false)} />
      )}
    </PageLayout>
  );
}

export default isAuth(ItemsPage, "admin");
