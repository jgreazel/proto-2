import LandingPage from "./landing";

import { useUser } from "@clerk/nextjs";
import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import dayjs from "dayjs";
import Link from "next/link";

function getGreeting(): { text: string; emoji: string } {
  const hour = dayjs().hour();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌙" };
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function HomePage() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <LandingPage />;
  }

  const { data: todayStats, isLoading } = api.reports.getNew.useQuery(
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
      refetchInterval: 5 * 60 * 1000,
    },
  );

  const { data: userSettings } = api.profile.getSettingsByUser.useQuery();

  const greeting = getGreeting();
  const isAdmin = userSettings?.isAdmin ?? false;

  const concessionTotal =
    todayStats?.purchaseReport?.summary.concessionTotal ?? 0;
  const admissionRevenue =
    todayStats?.admissionReport?.admissionEvents
      .filter((x) => x.type === "transaction")
      .reduce((sum, x) => {
        if (x.type === "transaction" && "amountSold" in x && "item" in x) {
          return sum + x.amountSold * x.item.sellingPrice;
        }
        return sum;
      }, 0) ?? 0;
  const totalRevenue = concessionTotal + admissionRevenue;
  const admissionCount =
    todayStats?.admissionReport?.admissionEvents.length ?? 0;
  const salesCount = todayStats?.purchaseReport?.transactions.length ?? 0;

  const quickActions = [
    {
      label: "Register",
      href: "/register",
      description: "Ring up a sale",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
        </svg>
      ),
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Passes",
      href: "/passes",
      description: "Season passes & patrons",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
      color: "bg-secondary/10 text-secondary",
    },
  ];

  const adminActions = [
    {
      label: "Reports",
      href: "/reports",
      description: "Revenue & admission reports",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
      color: "bg-warning/10 text-warning",
    },
    {
      label: "Items",
      href: "/items",
      description: "Manage inventory",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        </svg>
      ),
      color: "bg-error/10 text-error",
    },
    {
      label: "Users",
      href: "/users",
      description: "Manage team members",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      ),
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Files",
      href: "/files",
      description: "Documents & uploads",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      color: "bg-secondary/10 text-secondary",
    },
  ];

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="animate-fade-in p-4 md:p-6 lg:p-8">
          {/* Welcome Hero */}
          <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-secondary/80 p-6 text-primary-content shadow-xl md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-medium uppercase tracking-wider opacity-80">
                  {dayjs().format("dddd, MMMM D, YYYY")}
                </p>
                <h1 className="text-3xl font-bold md:text-4xl">
                  {greeting.emoji} {greeting.text}
                  {user?.username ? `, ${user.username}` : ""}!
                </h1>
                <p className="mt-2 opacity-80">
                  Here&apos;s what&apos;s happening at Guard Shack today.
                </p>
              </div>
              <div className="hidden text-6xl sm:block">{greeting.emoji}</div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Revenue */}
            <div className="card border border-base-200 bg-base-100 shadow-md transition-all duration-200 hover:shadow-lg">
              <div className="card-body p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-primary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content/60">Revenue</p>
                    <p className="text-2xl font-bold text-primary">${formatCents(totalRevenue)}</p>
                  </div>
                </div>
                <div className="divider my-1"></div>
                <div className="flex justify-between text-xs text-base-content/50">
                  <span>Concessions: ${formatCents(concessionTotal)}</span>
                  <span>Admissions: ${formatCents(admissionRevenue)}</span>
                </div>
              </div>
            </div>

            {/* Admissions */}
            <div className="card border border-base-200 bg-base-100 shadow-md transition-all duration-200 hover:shadow-lg">
              <div className="card-body p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-secondary">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content/60">Admissions</p>
                    <p className="text-2xl font-bold text-secondary">{admissionCount}</p>
                  </div>
                </div>
                <div className="divider my-1"></div>
                <div className="text-xs text-base-content/50">
                  People checked in today
                </div>
              </div>
            </div>

            {/* Sales */}
            <div className="card border border-base-200 bg-base-100 shadow-md transition-all duration-200 hover:shadow-lg">
              <div className="card-body p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6 text-accent">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content/60">Sales</p>
                    <p className="text-2xl font-bold text-accent">{salesCount}</p>
                  </div>
                </div>
                <div className="divider my-1"></div>
                <div className="text-xs text-base-content/50">
                  Transactions completed
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-base-content">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group card border border-base-200 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="card-body items-center p-4 text-center">
                    <div className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl ${action.color} transition-transform duration-200 group-hover:scale-110`}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold">{action.label}</h3>
                    <p className="text-xs text-base-content/50">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="mb-6">
              <h2 className="mb-4 text-lg font-semibold text-base-content">
                <span className="mr-2 inline-block rounded-lg bg-base-200 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-base-content/60">
                  Admin
                </span>
                Management
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {adminActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group card border border-base-200 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="card-body items-center p-4 text-center">
                      <div className={`mb-2 flex h-14 w-14 items-center justify-center rounded-2xl ${action.color} transition-transform duration-200 group-hover:scale-110`}>
                        {action.icon}
                      </div>
                      <h3 className="font-semibold">{action.label}</h3>
                      <p className="text-xs text-base-content/50">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default HomePage;
