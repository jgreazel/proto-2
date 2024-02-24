import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { type RouterOutputs, api, type RouterInputs } from "~/utils/api";
import { LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import { getEndOfDay } from "~/helpers/dateHelpers";

const PurchaseReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["purchaseReport"];
}) => {
  const { data } = props;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
      <h2 className="font-semibold">Purchase Report</h2>
      <div className="text-sm">
        {data?.startDate.toLocaleString() +
          " - " +
          data?.endDate.toLocaleString()}
      </div>
      <h3 className="underline">Summary</h3>
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
            <th>Admissions</th>
            <td>{data?.summary.admissionCount}</td>
            <td>{dbUnitToDollars(data?.summary.admissionTotal ?? 0)}</td>
          </tr>
          <tr>
            <th>Concessions</th>
            <td>{data?.summary.concessionCount}</td>
            <td>{dbUnitToDollars(data?.summary.concessionTotal ?? 0)}</td>
          </tr>
        </tbody>
      </table>
      <h3 className="underline">Transactions</h3>
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Label</th>
            <th># Sold</th>
            <th>Total ($)</th>
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
              <td>{t.createdAt.toLocaleString()}</td>
              <td>{t.createdBy}</td>
              <td>{t.item.isAdmissionItem ? "Admission" : "Concession"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdmissionReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["admissionReport"];
}) => {
  const { data } = props;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
      <h2 className="font-semibold">Admission Report</h2>
      <div className="text-sm">
        {data?.startDate.toLocaleString() +
          " - " +
          data?.endDate.toLocaleString()}
      </div>

      <h3 className="underline">Admissions</h3>
      <h3>Total: {data?.admissionEvents.length}</h3>
      <table className="table table-zebra">
        <thead>
          <tr>
            <th>Patron</th>
            <th>Time</th>
            <th>Cashier</th>
          </tr>
        </thead>
        <tbody>
          {data?.admissionEvents.map((e) => (
            <tr key={e.id}>
              <td>{`${e.patron.firstName} ${e.patron.lastName}`}</td>
              <td>{e.createdAt.toLocaleString()}</td>
              <td>{e.createdBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type ReportData = {
  // p = purchase report
  p: boolean;
  pStartDate: Date;
  pEndDate: Date;
  pIncludeAdmissions: boolean;
  pIncludeConcessions: boolean;
  // a = admission report
  a: boolean;
  aStartDate: Date;
  aEndDate: Date;
};

export default function ReportsPage() {
  const { register, handleSubmit, control, formState, watch } =
    useForm<ReportData>();
  const formVals = watch();
  const purchaseReport: RouterInputs["reports"]["getNew"]["purchaseReport"] = {
    startDate: formVals.pStartDate,
    endDate: getEndOfDay(formVals.pEndDate ?? new Date()),
    includeAdmissions: formVals.pIncludeAdmissions,
    includeConcessions: formVals.pIncludeConcessions,
  };
  const admissionReport: RouterInputs["reports"]["getNew"]["admissionReport"] =
    {
      startDate: formVals.aStartDate,
      endDate: getEndOfDay(formVals.aEndDate ?? new Date()),
    };
  const { data, refetch } = api.reports.getNew.useQuery(
    {
      purchaseReport: formVals.p ? purchaseReport : null,
      admissionReport: formVals.a ? admissionReport : null,
    },
    {
      enabled: false,
      onSuccess: () => {
        setShowReport(true);
      },
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
      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
          <h2 className="font-semibold">Select Report Criteria:</h2>
          <form className="flex flex-col gap-1" onSubmit={handleSubmit(submit)}>
            <div className="flex gap-1 align-middle">
              <input type="checkbox" className="checkbox" {...register("p")} />
              <label className="font-semibold">Purchase Report</label>
            </div>
            <div className="flex gap-2">
              <label className="self-center text-xs font-medium">
                Start Date
              </label>
              <Controller
                control={control}
                rules={{ required: formVals.p }}
                name="pStartDate"
                render={({ field }) => (
                  <DatePicker
                    disabled={!formVals.p}
                    className="input input-bordered grow"
                    placeholderText="Start Date"
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                  />
                )}
              />
              <label className="self-center text-xs font-medium">
                End Date
              </label>
              <Controller
                control={control}
                rules={{ required: formVals.p }}
                name="pEndDate"
                render={({ field }) => (
                  <DatePicker
                    disabled={!formVals.p}
                    className="input input-bordered grow"
                    placeholderText="End Date"
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                  />
                )}
              />
            </div>
            <div className="flex gap-1 align-middle">
              <input
                type="checkbox"
                className="checkbox"
                {...register("pIncludeAdmissions")}
                disabled={!formVals.p}
              />
              <label>Admissions</label>
            </div>
            <div className="flex gap-1 align-middle">
              <input
                type="checkbox"
                className="checkbox"
                {...register("pIncludeConcessions")}
                disabled={!formVals.p}
              />
              <label>Concessions</label>
            </div>
            <div className="divider"></div>
            <div className="flex gap-1 align-middle">
              <input type="checkbox" className="checkbox" {...register("a")} />
              <label className="font-semibold">Admission Report</label>
            </div>
            <div className="flex gap-2">
              <label className="self-center text-xs font-medium">
                Start Date
              </label>
              <Controller
                control={control}
                rules={{ required: formVals.a }}
                name="aStartDate"
                render={({ field }) => (
                  <DatePicker
                    disabled={!formVals.a}
                    className="input input-bordered grow"
                    placeholderText="Start Date"
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                  />
                )}
              />
              <label className="self-center text-xs font-medium">
                End Date
              </label>
              <Controller
                control={control}
                rules={{ required: formVals.a }}
                name="aEndDate"
                render={({ field }) => (
                  <DatePicker
                    disabled={!formVals.a}
                    className="input input-bordered grow"
                    placeholderText="End Date"
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                  />
                )}
              />
            </div>
            <div className="flex justify-end">
              <Button primary type="submit" disabled={!formState.isValid}>
                Generate Report
              </Button>
            </div>
          </form>
        </div>
        {loading && (
          <div className="flex justify-center">
            <LoadingSpinner size={36} />
          </div>
        )}
        {showReport && data?.purchaseReport && (
          <PurchaseReportTable data={data.purchaseReport} />
        )}
        {showReport && data?.admissionReport && (
          <AdmissionReportTable data={data.admissionReport} />
        )}
      </div>
    </PageLayout>
  );
}
