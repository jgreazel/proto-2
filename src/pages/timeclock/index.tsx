import dayjs from "dayjs";
import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";

// todo add clockPIN to userSettings

const ShiftFeed = () => {
  const { data, isLoading } = api.schedules.getShiftsByUser.useQuery({
    dateRange: [dayjs().startOf("day").toDate(), dayjs().endOf("day").toDate()],
  });

  if (isLoading) {
    return <div className="loading loading-spinner loading-md"></div>;
  }

  return (
    <div className="grid gap-2 p-2 md:grid-cols-2">
      {data?.map((x) => (
        <div
          className="card card-compact bg-base-100 shadow-lg"
          key={x.user.id}
        >
          <div className="card-body">
            <div className="card-title capitalize">{x.user.username}</div>
            <div className="font-medium">Scheduled Shifts Today:</div>
            {!!x.shifts.length ? (
              x.shifts.map((s) => (
                <div key={s.id} className="flex gap-1">
                  {dayjs(s.start).format("hh:mm A")}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                  {dayjs(s.end).format("hh:mm A")}
                </div>
              ))
            ) : (
              <div>None</div>
            )}
            <div className="card-actions justify-end">
              <button
                disabled={isLoading}
                className="btn btn-outline btn-primary"
                // onClick={handleDelete} // todo
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
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>
                Punch Time Card
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function TimeClockPage() {
  return (
    <PageLayout>
      {/* // todo date & time displayed */}
      <ShiftFeed />
    </PageLayout>
  );
}
