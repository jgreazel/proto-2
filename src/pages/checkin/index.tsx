import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { getStartOfDay, getEndOfDay } from "~/helpers/dateHelpers";
import filterPasses from "~/helpers/filterPasses";
import handleApiError from "~/helpers/handleApiError";
import { type RouterOutputs, api } from "~/utils/api";
import isAuth from "~/components/isAuth";

type Patron = RouterOutputs["passes"]["getAll"][number]["patrons"][number];

function CheckInPage() {
  const currentYear = new Date().getFullYear().toString();
  const { data: passesData, isLoading: isFetchingPasses } =
    api.passes.getAll.useQuery({ season: currentYear });
  const today = new Date();
  const {
    data: eventData,
    isLoading: isFetchingEvents,
    refetch,
  } = api.passes.getAdmissions.useQuery({
    range: [getStartOfDay(today), getEndOfDay(today)],
    includeVoided: false,
  });

  const { data: voidedEventData } = api.passes.getAdmissions.useQuery({
    range: [getStartOfDay(today), getEndOfDay(today)],
    includeVoided: true,
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

  const filteredPasses = passesData?.filter((p) => filterPasses(p, filter));

  // Count today's check-ins
  const checkedInCount = eventData?.filter((e) => !e.isVoided).length ?? 0;

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Guest Check-In</h1>
            <p className="text-sm text-base-content/60">
              Season pass admissions for today
            </p>
          </div>
          {checkedInCount > 0 && (
            <div className="badge badge-success gap-1 font-semibold">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-3 w-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {checkedInCount} checked in
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className="input input-bordered flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="h-4 w-4 opacity-50"
            >
              <path
                fillRule="evenodd"
                d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              type="text"
              className="grow"
              placeholder="Search by name…"
            />
          </label>
          {filter && (
            <p className="mt-2 text-xs text-base-content/50">
              {filteredPasses?.length ?? 0} matching passes
            </p>
          )}
        </div>

        {/* Loading */}
        {(isFetchingPasses || isFetchingEvents) && (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}

        {/* Pass Holders List */}
        {!isFetchingPasses &&
          !isFetchingEvents &&
          (filteredPasses && filteredPasses.length > 0 ? (
            <div className="space-y-4">
              {filteredPasses.map(({ label, patrons, id }) => (
                <div
                  className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm"
                  key={id}
                >
                  <div className="border-b border-base-300 bg-base-200/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="badge badge-primary badge-sm">
                        {label}
                      </div>
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
                      const hasVoidedAdmission = voidedEventData?.find(
                        (e) => e.patronId === p.id && e.isVoided,
                      );
                      return (
                        <div
                          className="flex items-center justify-between p-4 transition-colors hover:bg-base-200/30"
                          key={p.id}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                isCheckedIn
                                  ? "bg-success"
                                  : hasVoidedAdmission
                                  ? "bg-warning"
                                  : "bg-base-300"
                              }`}
                            />
                            <div>
                              <div className="font-medium capitalize text-base-content">
                                {`${p.firstName} ${p.lastName}`}
                              </div>
                              <div className="text-sm text-base-content/60">
                                {isCheckedIn ? (
                                  "Already checked in today"
                                ) : hasVoidedAdmission ? (
                                  <span className="text-warning">
                                    Previous check-in was voided
                                  </span>
                                ) : (
                                  "Ready to check in"
                                )}
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
                                {isCreating ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
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
                                )}
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
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-base-content">
                {filter
                  ? "No matching passes found"
                  : "No season passes available"}
              </h3>
              <p className="text-base-content/60">
                {filter
                  ? "Try adjusting your search terms"
                  : "Season passes will appear here when available"}
              </p>
            </div>
          ))}
      </div>
    </PageLayout>
  );
}

export default isAuth(CheckInPage, "employee");
