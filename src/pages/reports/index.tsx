import { type ReactElement, type Ref, forwardRef, useState } from "react";
import { DatePicker, Drawer } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { useForm, Controller } from "react-hook-form";

import { type RouterOutputs, api, type RouterInputs } from "~/utils/api";

import type { RangeValueType } from "../_app";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import NoData from "~/components/noData";
import handleApiError from "~/helpers/handleApiError";
import isAuth from "~/components/isAuth";
import Link from "next/link";
import { AdminTimeClock } from "../timeclock/admin";
import toast from "react-hot-toast";

const { RangePicker } = DatePicker;
dayjs.extend(duration);

type PurchReportTableProps = {
  data: RouterOutputs["reports"]["getNew"]["purchaseReport"];
  children?: ReactElement[] | ReactElement;
};

export const PurchaseReportTable = forwardRef<
  HTMLDivElement,
  PurchReportTableProps
>(function PurchaseReportTable(
  props: PurchReportTableProps,
  ref: Ref<HTMLDivElement>,
) {
  const { data } = props;

  return (
    <div className="p-2" ref={ref}>
      <div className="flex justify-between">
        <div>
          <h2 className="card-title">Purchase Report</h2>
          <div className="text-sm">
            {dayjs(data?.startDate).format("MMMM DD, YYYY") +
              " - " +
              dayjs(data?.endDate).format("MMMM DD, YYYY")}
          </div>
        </div>
        {props.children}
      </div>
      <div className="card card-compact bg-base-100">
        <div className="card-body">
          <h3 className="card-title">Summary</h3>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Quantity Sold</th>
                <th>Total ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Concessions</td>
                <td>{data?.summary.concessionCount}</td>
                <td>{dbUnitToDollars(data?.summary.concessionTotal ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card card-compact bg-base-100">
        <div className="card-body">
          <h3 className="card-title">Transactions</h3>
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Label</th>
                <th># Sold</th>
                <th>Total ($)</th>
                <th>Date</th>
                <th>Time</th>
                <th>Cashier</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {data?.transactions.map((t) => (
                <tr key={t.transactionId}>
                  <td>{t.item.label}</td>
                  <td>{t.amountSold}</td>
                  <td>{dbUnitToDollars(t.amountSold * t.item.sellingPrice)}</td>
                  <td>{dayjs(t.createdAt).format("MM/DD/YY")}</td>
                  <td>{dayjs(t.createdAt).format("h:mm A")}</td>
                  <td className="capitalize">{t.createdBy}</td>
                  <td>
                    <div className="badge badge-accent badge-outline">
                      Concession
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

type AdmsRptTableProps = {
  data: RouterOutputs["reports"]["getNew"]["admissionReport"];
  children?: ReactElement[] | ReactElement;
};

export const AdmissionReportTable = forwardRef<
  HTMLDivElement,
  AdmsRptTableProps
>(function AdmissionReportTable(
  props: AdmsRptTableProps,
  ref: Ref<HTMLDivElement>,
) {
  const { data } = props;

  return (
    <div className="p-2" ref={ref}>
      <div className="flex justify-between">
        <div>
          <h2 className="card-title">Admission Report</h2>
          <div className="text-sm">
            {dayjs(data?.startDate).format("MMMM DD, YYYY") +
              " - " +
              dayjs(data?.endDate).format("MMMM DD, YYYY")}
          </div>
        </div>
        {props.children}
      </div>
      <div className="card card-compact bg-base-100">
        <div className="card-body">
          <h3 className="card-title">Summary</h3>
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Count</th>
                <th>Total ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium">Members</td>
                <td>
                  {
                    data?.admissionEvents.filter((x) => x.type === "admission")
                      .length
                  }
                </td>
                <td>---</td>
              </tr>
              <tr>
                <td className="font-medium">Non-members</td>
                <td>
                  {data?.admissionEvents
                    .filter((x) => x.type === "transaction")
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                    .reduce((sum, x) => sum + x.amountSold, 0)}
                </td>
                <td>
                  {dbUnitToDollars(
                    data?.admissionEvents
                      .filter((x) => x.type === "transaction")
                      .reduce(
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
                        (sum, x) => sum + x.amountSold * x.item.sellingPrice,
                        0,
                      ) ?? 0,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card card-compact bg-base-100">
        <div className="card-body">
          <h3 className="card-title">Total: </h3>
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Patron</th>
                <th># Sold</th>
                <th>Total ($)</th>
                <th>Date</th>
                <th>Time</th>
                <th>Cashier</th>
                <th>Admission Type</th>
              </tr>
            </thead>
            <tbody>
              {data?.admissionEvents.map((e) =>
                e.type === "transaction" ? (
                  <tr key={e.itemId}>
                    <td>---</td>
                    <td>{e.amountSold}</td>
                    <td>
                      {dbUnitToDollars(e.amountSold * e.item.sellingPrice)}
                    </td>
                    <td>{dayjs(e.createdAt).format("MM/DD/YY")}</td>
                    <td>{dayjs(e.createdAt).format("h:mm A")}</td>
                    <td className="capitalize">{e.createdBy}</td>
                    <td>
                      <div className="badge badge-accent badge-outline capitalize">
                        {e.item.label}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={e.id}>
                    <td className="capitalize">{`${e.patron.firstName} ${e.patron.lastName}`}</td>
                    <td>---</td>
                    <td>---</td>
                    <td>{dayjs(e.createdAt).format("MM/DD/YY")}</td>
                    <td>{dayjs(e.createdAt).format("h:mm A")}</td>
                    <td className="capitalize">{e.createdBy}</td>
                    <td>
                      <div className="badge badge-primary badge-outline">
                        Member
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

type ReportData = {
  purchaseReportDateRange: RangeValueType<Dayjs>;

  admissionDataDateRange: RangeValueType<Dayjs>;

  timecardDateRange: RangeValueType<Dayjs>;
};

export function ReportsPage() {
  const [tabName, setTabName] = useState<"purchase" | "admission" | "timecard">(
    "purchase",
  );
  const { handleSubmit, control, formState, watch } = useForm<ReportData>();
  const formVals = watch();
  const purchaseReport: RouterInputs["reports"]["getNew"]["purchaseReport"] = {
    startDate: formVals.purchaseReportDateRange?.[0]?.toDate() ?? new Date(),
    endDate:
      formVals.purchaseReportDateRange?.[1]?.endOf("day").toDate() ??
      new Date(),
    includeAdmissions: false,
    includeConcessions: true,
  };
  const admissionReport: RouterInputs["reports"]["getNew"]["admissionReport"] =
    {
      startDate: formVals.admissionDataDateRange?.[0]?.toDate() ?? new Date(),
      endDate:
        formVals.admissionDataDateRange?.[1]?.endOf("day").toDate() ??
        new Date(),
    };
  const timecardReport: RouterInputs["reports"]["getNew"]["timecardReport"] = {
    startDate: formVals.timecardDateRange?.[0]?.toDate() ?? new Date(),
    endDate:
      formVals.timecardDateRange?.[1]?.endOf("day").toDate() ?? new Date(),
  };

  const { data, refetch } = api.reports.getNew.useQuery(
    {
      purchaseReport: tabName === "purchase" ? purchaseReport : null,
      admissionReport: tabName === "admission" ? admissionReport : null,
      timecardReport: tabName === "timecard" ? timecardReport : null,
    },
    {
      enabled: false,
      onSuccess: () => {
        setShowReport(true);
      },
      onError: handleApiError,
    },
  );

  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    // isLoading on query was being weird with being disabled
    setLoading(true);
    await refetch();
    setLoading(false);
  };

  return (
    <PageLayout>
      <div className="flex flex-col gap-3 p-2">
        <div role="tablist" className="tabs-boxed tabs max-w-lg">
          <a
            role="tab"
            className={`tab ${tabName === "purchase" && "tab-active"}`}
            onClick={() => setTabName("purchase")}
          >
            Concessions Report
          </a>
          <a
            role="tab"
            className={`tab ${tabName === "admission" && "tab-active"}`}
            onClick={() => setTabName("admission")}
          >
            Admission Report
          </a>
        </div>
        <div className="rounded-lg bg-base-100 p-2 shadow-lg">
          <form
            onSubmit={handleSubmit(submit)}
            className="flex flex-col gap-2 p-2"
          >
            {tabName === "purchase" && (
              <div className="p-2">
                <Controller
                  control={control}
                  name="purchaseReportDateRange"
                  render={({ field }) => (
                    <label className="form-control w-full max-w-xs">
                      <div className="label">
                        <span className="label-text">Date Range</span>
                      </div>
                      <RangePicker
                        value={field.value}
                        disabled={tabName !== "purchase"}
                        className="input input-bordered w-full max-w-xs"
                        onChange={(dates) => field.onChange(dates)}
                      />
                    </label>
                  )}
                />
              </div>
            )}
            {tabName === "admission" && (
              <div className="flex flex-col p-2">
                <Controller
                  control={control}
                  name="admissionDataDateRange"
                  render={({ field }) => (
                    <label className="form-control w-full max-w-xs">
                      <div className="label">
                        <span className="label-text">Date Range</span>
                      </div>
                      <RangePicker
                        value={field.value}
                        disabled={tabName !== "admission"}
                        className="input input-bordered w-full max-w-xs"
                        onChange={(dates) => field.onChange(dates)}
                      />
                    </label>
                  )}
                />
              </div>
            )}

            <div className="card-actions justify-end px-2">
              <button
                className="btn btn-primary"
                type="submit"
                disabled={!formState.isValid}
              >
                Generate Report
              </button>
            </div>
          </form>

          <div className="divider" />

          {loading && (
            <div className="flex justify-center">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          )}
          {!showReport && (
            <div className="flex flex-col items-center gap-4 p-12">
              <NoData />
              <div className="font-medium">Nothing to Show</div>
            </div>
          )}
          {showReport && data?.purchaseReport && (
            <PurchaseReportTable data={data.purchaseReport}>
              <div className="tooltip tooltip-left" data-tip="Print Report">
                <Link
                  href={{
                    pathname: "/reports/print/purchase",
                    query: {
                      start: formVals.purchaseReportDateRange[0]?.toISOString(),
                      end: formVals.purchaseReportDateRange[1]
                        ?.endOf("day")
                        .toISOString(),
                      includeAdmissions: false,
                      includeConcessions: true,
                    },
                  }}
                  className="btn btn-circle btn-sm p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                    />
                  </svg>
                </Link>
              </div>
            </PurchaseReportTable>
          )}
          {showReport && data?.admissionReport && (
            <AdmissionReportTable data={data.admissionReport}>
              <div className="tooltip tooltip-left" data-tip="Print Report">
                <Link
                  href={{
                    pathname: "/reports/print/admission",
                    query: {
                      start: formVals.admissionDataDateRange[0]?.toISOString(),
                      end: formVals.admissionDataDateRange[1]
                        ?.endOf("day")
                        .toISOString(),
                    },
                  }}
                  className="btn btn-circle btn-sm p-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z"
                    />
                  </svg>
                </Link>
              </div>
            </AdmissionReportTable>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(ReportsPage, "admin");
