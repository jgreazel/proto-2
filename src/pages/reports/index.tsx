import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  const { data, refetch, isLoading } = api.reports.getNew.useQuery(
    { purchaseReport },
    { enabled: false },
  );

  const submit = async () => {
    await refetch();
  };

  return (
    <PageLayout>
      <div className="flex w-full flex-col gap-2 rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl">
        <h2 className="font-semibold">Select Report Criteria:</h2>
        <h3 className="underline">Purchase Report</h3>
        <div>
          <form className="flex flex-col" onSubmit={handleSubmit(submit)}>
            <div className="flex gap-2">
              <label className="self-center text-xs font-medium">
                Start Date
              </label>
              <Controller
                control={control}
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
      </div>
    </PageLayout>
  );
}
