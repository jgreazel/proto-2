import { PageLayout } from "~/components/layout";
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
    <div className="card card-compact bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Purchase Report</h2>
        <div>
          {data?.startDate.toLocaleString() +
            " - " +
            data?.endDate.toLocaleString()}
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
                    <td>
                      {dbUnitToDollars(t.amountSold * t.item.sellingPrice)}
                    </td>
                    <td>{t.createdAt.toLocaleString()}</td>
                    <td>{t.createdBy}</td>
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
    </div>
  );
};

const AdmissionReportTable = (props: {
  data: RouterOutputs["reports"]["getNew"]["admissionReport"];
}) => {
  const { data } = props;

  return (
    <div className="card card-compact bg-base-200">
      <div className="card-body">
        <h2 className="card-title">Admission Report</h2>
        <div>
          {data?.startDate.toLocaleString() +
            " - " +
            data?.endDate.toLocaleString()}
        </div>
        <div className="card card-compact bg-base-100">
          <div className="card-body">
            <h3 className="card-title">
              Total: {data?.admissionEvents.length}
            </h3>
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
        </div>
      </div>
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
      <div className="flex flex-col gap-3 pt-2">
        <div className="card card-compact bg-base-200">
          <form onSubmit={handleSubmit(submit)}>
            <div className="card-body">
              <div className="card-title">Select Report Criteria</div>
              <div className="collapse collapse-arrow bg-base-100">
                <input {...register("p")} type="checkbox" />
                <div className="collapse-title card-title">Purchase Report</div>
                <div className="collapse-content">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="text-label">Admissions</span>
                      <input
                        {...register("pIncludeAdmissions")}
                        type="checkbox"
                        className="checkbox"
                        disabled={!formVals.p}
                      />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="text-label">Concessions</span>
                      <input
                        {...register("pIncludeConcessions")}
                        type="checkbox"
                        className="checkbox"
                        disabled={!formVals.p}
                      />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label">Start Date</label>
                    <Controller
                      control={control}
                      rules={{ required: formVals.p }}
                      name="pStartDate"
                      render={({ field }) => (
                        <DatePicker
                          disabled={!formVals.p}
                          className="input input-bordered grow"
                          placeholderText="--/--/----"
                          selected={field.value}
                          onChange={(date: Date) => field.onChange(date)}
                        />
                      )}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">End Date</label>
                    <Controller
                      control={control}
                      rules={{ required: formVals.p }}
                      name="pEndDate"
                      render={({ field }) => (
                        <DatePicker
                          disabled={!formVals.p}
                          className="input input-bordered grow"
                          placeholderText="--/--/----"
                          selected={field.value}
                          onChange={(date: Date) => field.onChange(date)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="collapse collapse-arrow bg-base-100">
                <input {...register("a")} type="checkbox" />

                <div className="collapse-title card-title">
                  Admission Report
                </div>
                <div className="collapse-content">
                  <div className="form-control">
                    <label className="label">Start Date</label>
                    <Controller
                      control={control}
                      rules={{ required: formVals.a }}
                      name="aStartDate"
                      render={({ field }) => (
                        <DatePicker
                          disabled={!formVals.a}
                          className="input input-bordered grow"
                          placeholderText="--/--/----"
                          selected={field.value}
                          onChange={(date: Date) => field.onChange(date)}
                        />
                      )}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">End Date</label>
                    <Controller
                      control={control}
                      rules={{ required: formVals.a }}
                      name="aEndDate"
                      render={({ field }) => (
                        <DatePicker
                          disabled={!formVals.a}
                          className="input input-bordered grow"
                          placeholderText="--/--/----"
                          selected={field.value}
                          onChange={(date: Date) => field.onChange(date)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="card-actions justify-end">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={!formState.isValid}
                >
                  Generate Report
                </button>
              </div>
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
