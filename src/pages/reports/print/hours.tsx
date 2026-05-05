import { useReactToPrint } from "react-to-print";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { useCallback, useRef } from "react";
import Link from "next/link";
import dayjs from "dayjs";

const HoursReportPrintPage = () => {
  const ref = useRef(null);
  const router = useRouter();
  const { query } = router;

  const [start, end] = [
    query.start ? new Date(query.start as string) : new Date(),
    query.end ? new Date(query.end as string) : new Date(),
  ];

  const { data, isLoading } = api.reports.getHoursReport.useQuery(
    { startDate: start, endDate: end },
    { enabled: !!query.start && !!query.end },
  );

  const reactToPrintContent = useCallback(() => ref.current, []);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: `Hours Report ${dayjs(start).format("MM/DD/YYYY")} – ${dayjs(end).format("MM/DD/YYYY")}`,
    removeAfterPrint: true,
  });

  if (isLoading || !data) return <PageLayout><LoadingPage /></PageLayout>;

  const totalH = Math.floor(data.totalMinutesAllStaff / 60);
  const totalM = Math.round(data.totalMinutesAllStaff % 60);

  return (
    <PageLayout>
      <div>
        {/* Controls — hidden when printing */}
        <div className="flex w-full justify-end gap-2 p-2 print:hidden">
          <Link href="/reports" className="btn btn-sm btn-ghost">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Reports
          </Link>
          <button onClick={handlePrint} className="btn btn-primary inline-flex items-center text-sm font-medium shadow-sm">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </button>
        </div>

        {/* Printable content */}
        <div ref={ref} className="p-6">
          <div className="mb-6 border-b pb-4">
            <h1 className="text-2xl font-bold">Hours Worked Report</h1>
            <p className="text-sm text-gray-500">
              {dayjs(start).format("MMMM D, YYYY")} – {dayjs(end).format("MMMM D, YYYY")}
            </p>
            <p className="mt-1 text-sm font-medium">
              Total all staff: {totalH}h {totalM}m
            </p>
          </div>

          {data.users.map((user) => {
            const uh = Math.floor(user.totalMinutes / 60);
            const um = Math.round(user.totalMinutes % 60);
            return (
              <div key={user.userId} className="mb-8 break-inside-avoid">
                <div className="mb-2 flex items-baseline justify-between">
                  <h2 className="text-base font-semibold capitalize">{user.displayName}</h2>
                  <span className="text-sm font-medium text-gray-600">
                    {uh}h {um}m total
                    {user.openShift && <span className="ml-2 text-amber-600">(open shift)</span>}
                  </span>
                </div>
                <table className="min-w-full border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border-b px-4 py-2 text-left font-medium text-gray-600">#</th>
                      <th className="border-b px-4 py-2 text-left font-medium text-gray-600">Clock In</th>
                      <th className="border-b px-4 py-2 text-left font-medium text-gray-600">Clock Out</th>
                      <th className="border-b px-4 py-2 text-left font-medium text-gray-600">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.shifts.map((shift, idx) => {
                      const sh = shift.minutesWorked !== null ? Math.floor(shift.minutesWorked / 60) : null;
                      const sm = shift.minutesWorked !== null ? Math.round(shift.minutesWorked % 60) : null;
                      return (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="border-b px-4 py-2 text-gray-400">{idx + 1}</td>
                          <td className="border-b px-4 py-2">{dayjs(shift.clockIn).format("h:mm A")}</td>
                          <td className="border-b px-4 py-2">
                            {shift.clockOut ? dayjs(shift.clockOut).format("h:mm A") : "Open"}
                          </td>
                          <td className="border-b px-4 py-2 font-medium">
                            {sh !== null && sm !== null ? `${sh}h ${sm}m` : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}

          {data.users.length === 0 && (
            <p className="text-center text-gray-400">No hours recorded for this period.</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default isAuth(HoursReportPrintPage, "admin");
