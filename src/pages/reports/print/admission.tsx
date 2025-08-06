import { useReactToPrint } from "react-to-print";

import isAuth from "~/components/isAuth";
import { AdmissionReportTable } from "..";
import { PageLayout } from "~/components/layout";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { useCallback, useRef } from "react";
import Link from "next/link";

const AdmissionReportPrintPage = () => {
  const ref = useRef(null);
  const router = useRouter();
  const { query } = router;

  const [start, end] = [
    query.start ? new Date(query.start as string) : new Date(),
    query.end ? new Date(query.end as string) : new Date(),
  ];

  const { data, isLoading } = api.reports.getNew.useQuery(
    {
      admissionReport: {
        startDate: start,
        endDate: end,
      },
    },
    {
      enabled: !!query.start && !!query.end, // Only run query when we have the required params
    },
  );

  const reactToPrintContent = useCallback(() => {
    return ref.current;
  }, []);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: `Admission Report ${start.toDateString()} - ${end.toDateString()}`,
    removeAfterPrint: true,
  });

  const content =
    isLoading || !data ? (
      <LoadingPage />
    ) : (
      <div>
        <div className="flex w-full justify-end gap-2 p-2">
          <Link className="btn btn-sm" href={"/reports"}>
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
                d="M15.75 19.5 8.25 12l7.5-7.5"
              />
            </svg>
            Back
          </Link>
          <button className="btn btn-sm" onClick={handlePrint}>
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
                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
              />
            </svg>
            Print
          </button>
        </div>
        <AdmissionReportTable
          data={data.admissionReport}
          ref={ref}
        ></AdmissionReportTable>
      </div>
    );

  return <PageLayout>{content}</PageLayout>;
};

export default isAuth(AdmissionReportPrintPage, "admin");
