import { PageLayout } from "~/components/layout";
import { useUser } from "@clerk/nextjs";
import isAuth from "~/components/isAuth";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import dayjs from "dayjs";

function HomePage() {
  const { user } = useUser();
  const { data: userSettings, isLoading } =
    api.profile.getSettingsByUser.useQuery();

  // Get today's basic stats for admins
  const { data: todayStats } = api.reports.getNew.useQuery(
    {
      purchaseReport: {
        startDate: dayjs().startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
        includeAdmissions: false,
        includeConcessions: true,
      },
      admissionReport: {
        startDate: dayjs().startOf("day").toDate(),
        endDate: dayjs().endOf("day").toDate(),
      },
    },
    {
      enabled: !!userSettings?.isAdmin,
      refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    },
  );

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="min-h-screen bg-base-100 p-4">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-base-content">
                  👋{" "}
                  {user?.username
                    ? `Welcome back, ${user.username}!`
                    : "Welcome!"}
                </h1>
                <p className="mt-2 text-base-content/70">
                  {dayjs().format("dddd, MMMM D, YYYY")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Quick Stats - Only for Admins */}
            {userSettings?.isAdmin && (
              <div className="lg:col-span-2">
                <div className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <h2 className="card-title text-lg">
                      Today&apos;s Overview
                    </h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div className="stat">
                        <div className="stat-figure text-primary">
                          <svg
                            className="inline-block h-8 w-8 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            ></path>
                          </svg>
                        </div>
                        <div className="stat-title">Revenue</div>
                        <div className="stat-value text-primary">
                          $
                          {(
                            (todayStats?.purchaseReport?.summary
                              .concessionTotal ?? 0) / 100
                          ).toFixed(2)}
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-figure text-secondary">
                          <svg
                            className="inline-block h-8 w-8 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            ></path>
                          </svg>
                        </div>
                        <div className="stat-title">Admissions</div>
                        <div className="stat-value text-secondary">
                          {todayStats?.admissionReport?.admissionEvents
                            .length ?? 0}
                        </div>
                      </div>

                      <div className="stat">
                        <div className="stat-figure text-accent">
                          <svg
                            className="inline-block h-8 w-8 stroke-current"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            ></path>
                          </svg>
                        </div>
                        <div className="stat-title">Sales</div>
                        <div className="stat-value text-accent">
                          {todayStats?.purchaseReport?.transactions.length ?? 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(HomePage, "employee");
