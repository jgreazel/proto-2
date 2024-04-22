import { useState } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { useForm, Controller } from "react-hook-form";

import { type RouterOutputs, api, type RouterInputs } from "~/utils/api";

import type { RangeValueType } from "../_app";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import NoData from "~/components/noData";
import handleApiError from "~/helpers/handleApiError";

const { RangePicker } = DatePicker;
dayjs.extend(duration);

const TimecardReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["timecardReport"];
}) => {
  return (
    <div className="p-2">
      <h2 className="card-title">Timecard Report</h2>
      {props.data?.shifts.map((x) => (
        <div key={x.user.id} className="card card-compact bg-base-100">
          <div className="card-body">
            <h3 className="card-title flex flex-row justify-between capitalize">
              <span>{x.user.username}</span>
              <span>
                {dayjs
                  .duration(x.totalWorkedMs)
                  .format("H [Hours], m [Minutes]")}
              </span>
            </h3>
            <span className="text-sm">
              {dayjs(x.period[0]).format("MMMM DD, YYYY") +
                " - " +
                dayjs(x.period[1]).format("MMMM DD, YYYY")}
            </span>
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {x.shifts.map((s) => (
                  <tr
                    key={
                      s.userId + s.clockIn.toString() + s.clockOut?.toString()
                    }
                  >
                    <td>{dayjs(s.clockIn).format("MM-DD-YYYY")}</td>
                    <td>{dayjs(s.clockIn).format("h:mm A")}</td>
                    <td>{dayjs(s.clockOut).format("h:mm A")}</td>
                    <td>
                      {dayjs
                        .duration(dayjs(s.clockOut).diff(dayjs(s.clockIn)))
                        .format("H [Hours], m [Minutes]")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

const PurchaseReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["purchaseReport"];
}) => {
  const { data } = props;

  return (
    <div className="p-2">
      <h2 className="card-title">Purchase Report</h2>
      <div className="text-sm">
        {dayjs(data?.startDate).format("MMMM DD, YYYY") +
          " - " +
          dayjs(data?.endDate).format("MMMM DD, YYYY")}
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
                <td className="font-medium">Admissions</td>
                <td>{data?.summary.admissionCount}</td>
                <td>{dbUnitToDollars(data?.summary.admissionTotal ?? 0)}</td>
              </tr>
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
                    {t.item.isAdmissionItem ? (
                      <div className="badge badge-secondary badge-outline">
                        Admission
                      </div>
                    ) : (
                      <div className="badge badge-accent badge-outline">
                        Concession
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdmissionReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["admissionReport"];
}) => {
  const { data } = props;

  return (
    <div className="p-2">
      <h2 className="card-title">Admission Report</h2>
      <div className="text-sm">
        {dayjs(data?.startDate).format("MMMM DD, YYYY") +
          " - " +
          dayjs(data?.endDate).format("MMMM DD, YYYY")}
      </div>
      <div className="card card-compact bg-base-100">
        <div className="card-body">
          <h3 className="card-title">Total: {data?.admissionEvents.length}</h3>
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Patron</th>
                <th>Date</th>
                <th>Time</th>
                <th>Cashier</th>
              </tr>
            </thead>
            <tbody>
              {data?.admissionEvents.map((e) => (
                <tr key={e.id}>
                  <td>{`${e.patron.firstName} ${e.patron.lastName}`}</td>
                  <td>{dayjs(e.createdAt).format("MM/DD/YY")}</td>
                  <td>{dayjs(e.createdAt).format("h:mm A")}</td>
                  <td className="capitalize">{e.createdBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

type ReportData = {
  patronDataDateRange: RangeValueType<Dayjs>;
  pIncludeAdmissions: boolean;
  pIncludeConcessions: boolean;

  admissionDataDateRange: RangeValueType<Dayjs>;

  timecardDateRange: RangeValueType<Dayjs>;
};

export default function ReportsPage() {
  const [tabName, setTabName] = useState<"purchase" | "admission" | "timecard">(
    "purchase",
  );
  const { register, handleSubmit, control, formState, watch } =
    useForm<ReportData>();
  const formVals = watch();
  const purchaseReport: RouterInputs["reports"]["getNew"]["purchaseReport"] = {
    startDate: formVals.patronDataDateRange?.[0]?.toDate() ?? new Date(),
    endDate:
      formVals.patronDataDateRange?.[1]?.endOf("day").toDate() ?? new Date(),
    includeAdmissions: formVals.pIncludeAdmissions,
    includeConcessions: formVals.pIncludeConcessions,
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
    endDate: formVals.timecardDateRange?.[1]?.toDate() ?? new Date(),
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
            Purchase Report
          </a>
          <a
            role="tab"
            className={`tab ${tabName === "admission" && "tab-active"}`}
            onClick={() => setTabName("admission")}
          >
            Admission Report
          </a>
          <a
            role="tab"
            className={`tab ${tabName === "timecard" && "tab-active"}`}
            onClick={() => setTabName("timecard")}
          >
            Timecard Report
          </a>
        </div>
        <div className="rounded-lg bg-base-100 p-2 shadow-lg">
          <form
            onSubmit={handleSubmit(submit)}
            className="flex flex-col gap-2 p-2"
          >
            {tabName === "purchase" && (
              <div className="flex flex-col p-2">
                <div className="form-control">
                  <label className="label w-fit cursor-pointer gap-2">
                    <input
                      {...register("pIncludeAdmissions")}
                      type="checkbox"
                      className="checkbox"
                      disabled={tabName !== "purchase"}
                    />
                    <span className="text-label">Admissions</span>
                  </label>
                </div>
                <div className="form-control">
                  <label className="label w-fit cursor-pointer gap-2">
                    <input
                      {...register("pIncludeConcessions")}
                      type="checkbox"
                      className="checkbox"
                      disabled={tabName !== "purchase"}
                    />
                    <span className="text-label">Concessions</span>
                  </label>
                </div>
                <Controller
                  control={control}
                  name="patronDataDateRange"
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
            {tabName === "timecard" && (
              <div className="flex flex-col p-2">
                <Controller
                  control={control}
                  name="timecardDateRange"
                  render={({ field }) => (
                    <label className="form-control w-full max-w-xs">
                      <div className="label">
                        <span className="label-text">Date Range</span>
                      </div>
                      <RangePicker
                        value={field.value}
                        disabled={tabName !== "timecard"}
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
            <PurchaseReportTable data={data.purchaseReport} />
          )}
          {showReport && data?.admissionReport && (
            <AdmissionReportTable data={data.admissionReport} />
          )}
          {showReport && data?.timecardReport && (
            <TimecardReportTable data={data.timecardReport} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
