import Link from "next/link";
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
import NoData from "~/components/noData";
import isAuth from "~/components/isAuth";
import dayjs from "dayjs";
type Item = RouterOutputs["items"]["getAll"][number]["item"];

const RecentSales = () => {
  const [hoursBack, setHoursBack] = useState(24);
  const [voidingTransaction, setVoidingTransaction] = useState<string | null>(
    null,
  );
  const [voidReason, setVoidReason] = useState("");

  const {
    data: completedSales,
    isLoading,
    refetch,
  } = api.items.getCompletedSales.useQuery(
    { hoursBack },
    {
      onError: handleApiError,
    },
  );

  const { mutate: voidTransaction, isLoading: isVoiding } =
    api.items.voidTransaction.useMutation({
      onSuccess: (data) => {
        toast.success(
          `Transaction voided. Refund: ${dbUnitToDollars(data.refundAmount)}`,
          {
            duration: 5000,
          },
        );
        setVoidingTransaction(null);
        setVoidReason("");
        void refetch();
      },
      onError: handleApiError,
    });

  const handleHoursBackChange = (hours: number) => {
    setHoursBack(hours);
    void refetch();
  };

  const handleVoidClick = (transactionId: string) => {
    setVoidingTransaction(transactionId);
    setVoidReason("");
  };

  const handleVoidConfirm = () => {
    if (!voidingTransaction || !voidReason.trim()) return;

    voidTransaction({
      transactionId: voidingTransaction,
      voidReason: voidReason.trim(),
    });
  };

  const handleVoidCancel = () => {
    setVoidingTransaction(null);
    setVoidReason("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Time Window Controls */}
      <div className="mb-6 rounded-lg border border-base-300 bg-base-100 p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">Time Window: </span>
            <div className="mt-2 flex gap-2">
              {[1, 8, 24, 72, 168].map((hours) => (
                <button
                  key={hours}
                  className={`btn btn-sm ${
                    hoursBack === hours ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => handleHoursBackChange(hours)}
                >
                  {hours === 1
                    ? "1 Hour"
                    : hours === 8
                    ? "8 Hours"
                    : hours === 24
                    ? "24 Hours"
                    : hours === 72
                    ? "3 Days"
                    : "7 Days"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm text-base-content/60">
              Showing sales from last {hoursBack} hour
              {hoursBack !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      {completedSales && completedSales.length > 0 ? (
        <div className="space-y-3">
          {completedSales.map((sale) => (
            <div
              key={sale!.id}
              className="rounded-lg border border-base-300 bg-base-100 p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="rounded bg-base-200 px-2 py-1 font-mono text-xs text-base-content/60">
                      #{sale!.id.slice(-8)}
                    </div>
                    <div className="text-sm text-base-content/70">
                      {dayjs(sale!.createdAt).format("MMM DD, h:mm A")}
                    </div>
                    <div className="badge badge-success badge-xs">
                      Completed
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-semibold text-success">
                        {dbUnitToDollars(sale!.total)}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {sale!.items.map((item, idx) => (
                          <span key={idx}>
                            {item.amountSold}x {item.label}
                            {idx < sale!.items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Void Button */}
                <div className="ml-4">
                  <button
                    className="btn btn-error btn-sm gap-2"
                    onClick={() => handleVoidClick(sale!.id)}
                    disabled={isVoiding}
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
                        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                      />
                    </svg>
                    {isVoiding ? "Voiding..." : "Void"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-base-200">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-base-content/40"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125M8.25 8.25V6.108"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-base-content">
            No recent sales found
          </h3>
          <p className="text-base-content/60">
            Completed sales from the last {hoursBack} hour
            {hoursBack !== 1 ? "s" : ""} will appear here
          </p>
        </div>
      )}

      {/* Void Transaction Modal */}
      {voidingTransaction && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="mb-4 text-lg font-bold">Void Transaction</h3>
            <div className="mb-4">
              <p className="mb-2 text-sm text-base-content/70">
                This will void the transaction and refund the customer.
                Inventory will be restored.
              </p>
              <p className="text-sm font-medium text-warning">
                This action cannot be undone.
              </p>
            </div>

            <div className="form-control mb-6">
              <label className="label">
                <span className="label-text font-medium">
                  Reason for void *
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 resize-none"
                placeholder="Enter reason for voiding this transaction..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                maxLength={500}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/60">
                  {voidReason.length}/500 characters
                </span>
              </label>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={handleVoidCancel}
                disabled={isVoiding}
              >
                Cancel
              </button>
              <button
                className="btn btn-error gap-2"
                onClick={handleVoidConfirm}
                disabled={isVoiding || !voidReason.trim()}
              >
                {isVoiding ? (
                  <>
                    <LoadingSpinner />
                    Voiding...
                  </>
                ) : (
                  <>
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
                        d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                      />
                    </svg>
                    Confirm Void
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ItemFeed = (props: {
  category: "admission" | "concession";
  onClick: (data: Item) => void;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { data, isLoading } = api.items.getAll.useQuery({
    category: props.category,
  });

  if (isLoading)
    return (
      <div className="my-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );

  if (!data?.length) {
    return (
      <div className="p-12">
        <NoData />
        <div className="mt-8 text-center font-medium">No Items Yet</div>
      </div>
    );
  }

  // Group items by category
  const itemsByCategory = data.reduce(
    (acc, { item }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const rawCategory = item.category;
      const category =
        typeof rawCategory === "string" && rawCategory.trim()
          ? rawCategory.trim()
          : "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(item);
      return acc;
    },
    {} as Record<string, Item[]>,
  );

  // Get all available categories for filtering
  const availableCategories = Object.keys(itemsByCategory).sort();

  // Filter by selected category
  const filteredCategories =
    selectedCategory === "all"
      ? availableCategories
      : availableCategories.filter((cat) => cat === selectedCategory);

  return (
    <>
      {/* Category Filter */}
      {availableCategories.length > 1 && (
        <div className="space-y-3 p-4 pb-2">
          {/* Quick filter buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              className={`btn btn-xs ${
                selectedCategory === "all" ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All ({data.length})
            </button>
            {availableCategories.map((category) => (
              <button
                key={category}
                className={`btn btn-xs ${
                  selectedCategory === category ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({itemsByCategory[category]?.length})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Items grouped by category */}
      <div className="p-4 pt-2">
        {filteredCategories.map((categoryName) => (
          <div key={categoryName} className="mb-6">
            <h3 className="mb-3 border-b border-base-300 pb-1 text-lg font-semibold text-base-content/80">
              {categoryName}
              <span className="ml-2 text-sm font-normal text-base-content/60">
                ({itemsByCategory[categoryName]?.length} items)
              </span>
            </h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {itemsByCategory[categoryName]?.map((item) => (
                <button
                  onClick={() => props.onClick(item)}
                  key={item.id}
                  className="btn btn-outline h-auto min-h-[3rem] whitespace-normal text-left capitalize"
                >
                  <div className="flex w-full flex-col items-start">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs opacity-70">
                      {dbUnitToDollars(item.sellingPrice)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
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
      toast.success(`Enjoy your swim, ${data.patron.firstName}!`);
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
        <div className="loading loading-spinner"></div>
      </div>
    );

  const filteredPasses = passesData?.filter((p) => filterPasses(p, filter));

  return (
    <div className="p-6">
      {/* Search Header */}
      <div className="mb-6">
        <label
          htmlFor="pass-filter"
          className="mb-2 block text-sm font-medium text-base-content"
        >
          Search Season Pass Holders
        </label>
        <div className="relative">
          <input
            id="pass-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            type="text"
            className="input input-bordered w-full pl-10"
            placeholder="Search by name..."
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-base-content/40"
          >
            <path
              fillRule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Pass Holders List */}
      {!!filteredPasses && filteredPasses.length > 0 ? (
        <div className="space-y-4">
          {filteredPasses.map(({ label, patrons, id }) => (
            <div
              className="overflow-hidden rounded-lg border border-base-300"
              key={id}
            >
              <div className="border-b border-base-300 bg-base-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="badge badge-primary badge-sm">{label}</div>
                  <span className="text-sm text-base-content/60">
                    {patrons.length}{" "}
                    {patrons.length === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-base-200">
                {patrons.map((p) => {
                  const isCheckedIn = eventData?.find(
                    (e) => e.patronId === p.id,
                  );
                  return (
                    <div
                      className="hover:bg-base-50 flex items-center justify-between p-4 transition-colors"
                      key={p.id}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            isCheckedIn ? "bg-success" : "bg-base-300"
                          }`}
                        />
                        <div>
                          <div className="font-medium capitalize text-base-content">
                            {`${p.firstName} ${p.lastName}`}
                          </div>
                          <div className="text-sm text-base-content/60">
                            {isCheckedIn
                              ? "Already checked in today"
                              : "Ready to check in"}
                          </div>
                        </div>
                      </div>
                      <div>
                        {isCheckedIn ? (
                          <div className="flex items-center gap-2 text-success">
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
                                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                              />
                            </svg>
                            <span className="text-sm font-medium">
                              Checked In
                            </span>
                          </div>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm gap-2"
                            onClick={() => onClick(p)}
                            disabled={isCreating}
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
                                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                              />
                            </svg>
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-base-200 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-base-content/40"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-base-content">
            {filter ? "No matching passes found" : "No season passes available"}
          </h3>
          <p className="text-base-content/60">
            {filter
              ? "Try adjusting your search terms"
              : "Season passes will appear here when available"}
          </p>
        </div>
      )}
    </div>
  );
};

function CheckoutPage() {
  const [mode, setMode] = useState<"sales" | "checkin" | "recent">("sales");
  const [feed, setFeed] = useState<"concession" | "admission">("concession");
  const [cart, setCart] = useState<Item[]>([]);
  const cartTotal = cart.reduce((acc, x) => (acc += x.sellingPrice), 0);
  const { mutate, isLoading } = api.items.checkout.useMutation({
    onError: (d) => {
      toast.error(d.message);
    },
    onSuccess: (r) => {
      setCart([]);
      toast.success(`${r.message} Collect ${dbUnitToDollars(r.total)}`, {
        duration: 5000,
      });
      if (r.action) {
        toast(
          (t) => (
            <span className="flex flex-row items-center justify-between gap-2">
              <button
                className="btn btn-circle btn-sm"
                onClick={() => toast.dismiss(t.id)}
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
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {r.action?.message}
              <Link
                className="btn btn-square btn-primary btn-sm"
                href={r.action?.href ?? ""}
              >
                Go
              </Link>
            </span>
          ),
          {
            duration: Infinity,
          },
        );
      }
    },
  });

  const shoppingList = (
    <>
      <div role="tablist" className="tabs-boxed tabs">
        <a
          role="tab"
          className={`tab ${feed === "concession" && "tab-active"}`}
          onClick={() => setFeed("concession")}
        >
          Concessions
        </a>
        <a
          role="tab"
          className={`tab ${feed === "admission" && "tab-active"}`}
          onClick={() => setFeed("admission")}
        >
          Passes
        </a>
      </div>
      <ItemFeed
        onClick={(data) => {
          setCart((prev) => [...prev, data]);
        }}
        category={feed}
      />
    </>
  );

  return (
    <PageLayout>
      {/* Mode Selection Header */}
      <div className="mb-6 border-b border-base-300 p-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div role="tablist" className="tabs-boxed tabs">
            <a
              role="tab"
              className={`tab ${mode === "sales" && "tab-active"}`}
              onClick={() => setMode("sales")}
            >
              Sales & Checkout
            </a>
            <a
              role="tab"
              className={`tab ${mode === "checkin" && "tab-active"}`}
              onClick={() => setMode("checkin")}
            >
              Guest Check-In
            </a>
            <a
              role="tab"
              className={`tab ${mode === "recent" && "tab-active"}`}
              onClick={() => setMode("recent")}
            >
              Recent Sales
            </a>
          </div>
        </div>
      </div>
      {/* Sales Mode */}
      {mode === "sales" && (
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="hidden p-2 md:block md:w-2/3">{shoppingList}</div>
          <div className="p-2 md:w-1/3">
            <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-lg">
              <div className="flex flex-row items-center gap-3 border-b border-base-300 pb-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-base-content">
                    Shopping Cart
                  </h3>
                  <p className="text-sm text-base-content/60">
                    {cart.length} {cart.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <div className="min-h-[200px] space-y-3 py-4">
                {cart.length > 0 ? (
                  cart.map((i, idx) => (
                    <div
                      className="bg-base-50 flex flex-row items-center justify-between rounded-lg border border-base-200 p-3 transition-colors hover:border-base-300"
                      key={`${i.id}-${idx}`}
                    >
                      <div className="flex flex-1 flex-col">
                        <div className="font-medium text-base-content">
                          {i.label}
                        </div>
                        <div className="text-sm font-semibold text-primary">
                          {dbUnitToDollars(i.sellingPrice)}
                        </div>
                      </div>
                      <div
                        className="tooltip tooltip-left"
                        data-tip="Remove item"
                      >
                        <button
                          className="btn btn-circle btn-ghost btn-sm transition-colors hover:btn-error"
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
                            className="h-4 w-4"
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
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 rounded-lg bg-base-200 p-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-8 w-8 text-base-content/40"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                        />
                      </svg>
                    </div>
                    <p className="font-medium text-base-content/60">
                      Your cart is empty
                    </p>
                    <p className="text-sm text-base-content/40">
                      Add items to get started
                    </p>
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="mb-4 border-t border-base-300 pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-primary">
                      {dbUnitToDollars(cartTotal)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-row justify-end gap-3">
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!cart.length}
                  onClick={() => {
                    setCart([]);
                  }}
                >
                  Clear Cart
                </button>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner />
                    <span className="text-sm">Processing...</span>
                  </div>
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
                        d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H3.75M3.75 6v.75c0 .414.336.75.75.75h.75m0-1.5h.75v.75c0 .414.336.75.75.75H6v-.75c0-.414-.336-.75-.75-.75H4.5V6h-.75m0 0H3v-.375M21 18.75v.375c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V6.75a1.125 1.125 0 0 1 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v12Z"
                      />
                    </svg>
                    Complete Purchase
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="block p-2 md:hidden">{shoppingList}</div>
        </div>
      )}{" "}
      {/* Check-In Mode */}
      {mode === "checkin" && (
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6">
            {/* Header Section */}
            <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">
                    Season Pass Check-In
                  </h2>
                  <p className="text-sm text-base-content/60">
                    Admit guests with valid season passes
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-info/20 bg-info/10 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-info"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-info">
                      How to check in guests:
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-base-content/70">
                      <li>
                        • Search for the guest&apos;s name using the search bar
                        below
                      </li>
                      <li>• Click the check-in button next to their name</li>
                      <li>
                        • Already checked-in guests won&apos;t show a button
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in Interface */}
            <div className="rounded-lg border border-base-300 bg-base-100 shadow-lg">
              <AdmissionFeed />
            </div>
          </div>
        </div>
      )}
      {/* Recent Sales Mode */}
      {mode === "recent" && (
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6">
            {/* Header Section */}
            <div className="rounded-lg border border-base-300 bg-base-100 p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6 text-primary"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h4.125M8.25 8.25V6.108"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">
                    Recent Sales
                  </h2>
                  <p className="text-sm text-base-content/60">
                    View and void recent concession sales
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warning">
                      Voiding sales:
                    </p>
                    <ul className="mt-1 space-y-1 text-sm text-base-content/70">
                      <li>
                        • Voiding will refund the sale and restore inventory
                      </li>
                      <li>
                        • Only concession items can be voided (admission passes
                        cannot)
                      </li>
                      <li>• This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sales Interface */}
            <div className="rounded-lg border border-base-300 bg-base-100 shadow-lg">
              <RecentSales />
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(CheckoutPage, "employee");
