import { useReactToPrint } from "react-to-print";

import isAuth from "~/components/isAuth";
import { ItemChangeLogTable } from "..";
import { PageLayout } from "~/components/layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { useCallback, useRef } from "react";
import Link from "next/link";

const ItemChangeLogReportPrintPage = () => {
  const ref = useRef(null);
  const router = useRouter();
  const { query } = router;

  console.log(query);

  const [start, end] = [
    new Date(query.start as string),
    new Date(query.end as string),
  ];

  const { data, isLoading } = api.reports.getNew.useQuery({
    itemChangeLogReport: {
      startDate: start,
      endDate: end,
    },
  });

  const reactToPrintContent = useCallback(() => {
    return ref.current;
  }, [ref.current]);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: `Item Change Log Report ${start.toDateString()} - ${end.toDateString()}`,
    removeAfterPrint: true,
  });

  const content =
    isLoading || !data ? (
      <LoadingPage />
    ) : (
      <div>
        <div className="flex w-full justify-end gap-2 p-2">
          <Link
            href="/reports"
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Reports
          </Link>
          <button
            onClick={handlePrint}
            className="btn btn-primary inline-flex items-center text-sm font-medium shadow-sm"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
        <div ref={ref}>
          {data.itemChangeLogReport && (
            <ItemChangeLogTable data={data.itemChangeLogReport} />
          )}
        </div>
      </div>
    );

  return <PageLayout>{content}</PageLayout>;
};

export default isAuth(ItemChangeLogReportPrintPage, "admin");
