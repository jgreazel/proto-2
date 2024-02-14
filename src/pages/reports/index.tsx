import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { api } from "~/utils/api";
import { LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";

type PurchaseReportData = {
  startDate: Date;
  endDate: Date;
  includeAdmissions: boolean;
  includeConcessions: boolean;
};

export default function ReportsPage() {
  const { register, handleSubmit, control, formState, watch } =
    useForm<PurchaseReportData>();
  const formVals = watch();
  const endEOD = new Date(formVals.endDate);
  endEOD.setHours(23, 59, 59, 999);
  const purchaseReport = { ...formVals, endDate: endEOD };
  const { data, refetch } = api.reports.getNew.useQuery(
    { purchaseReport },
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
        <div className="flex w-full flex-col gap-2 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
          <h2 className="font-semibold">Select Report Criteria:</h2>
          <h3 className="underline">Purchase Report</h3>
          <form className="flex flex-col" onSubmit={handleSubmit(submit)}>
            <div className="flex gap-2">
              <label className="self-center text-xs font-medium">
                Start Date
              </label>
              <Controller
                control={control}
                rules={{ required: true }}
                name="startDate"
                render={({ field }) => (
                  <DatePicker
                    // disabled={props.disabled} // watch
                    className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none disabled:bg-slate-200"
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
                rules={{ required: true }}
                name="endDate"
                render={({ field }) => (
                  <DatePicker
                    // disabled={props.disabled} // watch
                    className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none disabled:bg-slate-200"
                    placeholderText="End Date"
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                  />
                )}
              />
            </div>
            <div className="flex gap-1 align-middle">
              <input type="checkbox" {...register("includeAdmissions")} />
              <label>Admissions</label>
            </div>
            <div className="flex gap-1 align-middle">
              <input type="checkbox" {...register("includeConcessions")} />
              <label>Concessions</label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={!formState.isValid}>
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
        {showReport && data && (
          <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
            <h2 className="font-semibold">Purchase Report</h2>
            <div className="text-sm">
              {data.purchaseReport.startDate.toLocaleString() +
                " - " +
                data.purchaseReport.endDate.toLocaleString()}
            </div>
            <h3 className="underline">Summary</h3>
            <div className="grid grid-cols-3 grid-rows-3">
              <div></div>
              <div>Quantity Sold</div>
              <div>Total ($)</div>
              <div>Admissions</div>
              <div>{data.purchaseReport.summary.admissionCount}</div>
              <div>
                {dbUnitToDollars(data.purchaseReport.summary.admissionTotal)}
              </div>
              <div>Concessions</div>
              <div>{data.purchaseReport.summary.concessionCount}</div>
              <div>
                {dbUnitToDollars(data.purchaseReport.summary.concessionTotal)}
              </div>
            </div>
            <h3 className="underline">Transactions</h3>
            <table>
              <tr>
                <th>Label</th>
                <th># Sold</th>
                <th>Total ($)</th>
                <th>Time</th>
                <th>Cashier</th>
                <th>Type</th>
              </tr>
              {data.purchaseReport.transactions.map((t) => (
                <tr key={t.transactionId}>
                  <td>{t.item.label}</td>
                  <td>{t.amountSold}</td>
                  <td>{dbUnitToDollars(t.amountSold * t.item.sellingPrice)}</td>
                  <td>{t.createdAt.toLocaleString()}</td>
                  <td>{t.createdBy}</td>
                  <td>{t.item.isAdmissionItem ? "Admission" : "Concession"}</td>
                </tr>
              ))}
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
