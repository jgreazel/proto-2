import { type ReactElement, type Ref, forwardRef, useState } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { LoadingSpinner } from "~/components/loading";

import { type RouterOutputs, api, type RouterInputs } from "~/utils/api";

import type { RangeValueType } from "../_app";
import { PageLayout } from "~/components/layout";
import dbUnitToDollars from "~/helpers/dbUnitToDollars";
import handleApiError from "~/helpers/handleApiError";
import isAuth from "~/components/isAuth";
import Link from "next/link";

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
    <div className="space-y-6" ref={ref}>
      {/* Header Section */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-base-content">
              Purchase Report
            </h1>
            <p className="mt-1 text-sm text-base-content/70">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Active Revenue
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {dbUnitToDollars(data?.summary.concessionTotal ?? 0)}
              </p>
              <p className="text-xs text-base-content/60">
                {data?.summary.concessionCount} items
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-error/10 p-3">
              <svg
                className="h-6 w-6 text-error"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">Voided Sales</p>
              <p className="text-2xl font-semibold text-base-content">
                {dbUnitToDollars(data?.summary.voidedConcessionTotal ?? 0)}
              </p>
              <p className="text-xs text-base-content/60">
                {data?.summary.voidedConcessionCount} items voided
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-success/10 p-3">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Total Transactions
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {data?.summary.totalTransactions ?? 0}
              </p>
              <p className="text-xs text-base-content/60">
                {data?.summary.voidedTransactions ?? 0} voided
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-secondary/10 p-3">
              <svg
                className="h-6 w-6 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">Net Revenue</p>
              <p className="text-2xl font-semibold text-base-content">
                {dbUnitToDollars(
                  (data?.summary.concessionTotal ?? 0) -
                    (data?.summary.voidedConcessionTotal ?? 0),
                )}
              </p>
              <p className="text-xs text-base-content/60">After voids</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 px-6 py-4">
          <h3 className="text-lg font-medium text-base-content">
            Transaction Details
          </h3>
          <p className="mt-1 text-sm text-base-content/70">
            Complete list of all purchase transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-200/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Void Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 bg-base-100">
              {data?.transactions.map((transaction, index) => (
                <tr
                  key={transaction!.id}
                  className={`${index % 2 === 0 ? "bg-base-100" : "bg-base-200/50"} ${
                    transaction!.isVoided ? "opacity-75" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-base-content">
                    #{transaction!.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-base-content">
                    <div className="space-y-1">
                      {transaction!.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.amountSold}x {item.label}
                          </span>
                          <span className="font-medium">
                            {dbUnitToDollars(item.lineTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-base-content">
                    {dbUnitToDollars(transaction!.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                    <div>
                      <div>
                        {dayjs(transaction!.createdAt).format("MMM DD, YYYY")}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {dayjs(transaction!.createdAt).format("h:mm A")}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-base-content/70">
                    {transaction!.createdBy}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {transaction!.isVoided ? (
                      <span className="inline-flex rounded-full bg-error/20 px-2 py-1 text-xs font-medium text-error">
                        VOIDED
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-success/20 px-2 py-1 text-xs font-medium text-success">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-base-content/70">
                    {transaction!.isVoided ? (
                      <div className="space-y-1">
                        <div className="text-xs">
                          <strong>Voided by:</strong> {transaction!.voidedBy}
                        </div>
                        <div className="text-xs">
                          <strong>Date:</strong>{" "}
                          {dayjs(transaction!.voidedAt).format(
                            "MMM DD, h:mm A",
                          )}
                        </div>
                        <div className="text-xs">
                          <strong>Reason:</strong>{" "}
                          <span className="italic">
                            {transaction!.voidReason}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-base-content/40">—</span>
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

  const memberCount =
    data?.admissionEvents.filter((x) => x.type === "admission").length ?? 0;
  const nonMemberCount =
    data?.admissionEvents
      .filter((x) => x.type === "transaction")
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .reduce((sum, x) => sum + x.amountSold, 0) ?? 0;
  const nonMemberRevenue =
    data?.admissionEvents
      .filter((x) => x.type === "transaction")
      .reduce(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        (sum, x) => sum + x.amountSold * x.item.sellingPrice,
        0,
      ) ?? 0;

  return (
    <div className="space-y-6" ref={ref}>
      {/* Header Section */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-base-content">
              Admission Report
            </h1>
            <p className="mt-1 text-sm text-base-content/70">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-success/10 p-3">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Member Admissions
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {memberCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-warning/10 p-3">
              <svg
                className="h-6 w-6 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Non-Member Tickets
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {nonMemberCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-success/10 p-3">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Ticket Revenue
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {dbUnitToDollars(nonMemberRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">Total Entries</p>
              <p className="text-2xl font-semibold text-base-content">
                {memberCount + nonMemberCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admission Events Table */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 px-6 py-4">
          <h3 className="text-lg font-medium text-base-content">
            Admission Details
          </h3>
          <p className="mt-1 text-sm text-base-content/70">
            Complete list of all admission events and ticket sales
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-200/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Patron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 bg-base-100">
              {data?.admissionEvents.map((e, index) =>
                e.type === "transaction" ? (
                  <tr
                    key={e.itemId}
                    className={index % 2 === 0 ? "bg-base-100" : "bg-base-200/50"}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/60">
                      Non-member
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content">
                      {e.amountSold}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-base-content">
                      {dbUnitToDollars(e.amountSold * e.item.sellingPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                      {dayjs(e.createdAt).format("MMM DD, YYYY")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                      {dayjs(e.createdAt).format("h:mm A")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-base-content/70">
                      {e.createdBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-warning/20 px-2 py-1 text-xs font-medium capitalize text-warning">
                        {e.item.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-success/20 px-2 py-1 text-xs font-medium text-success">
                        Active
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={e.id}
                    className={index % 2 === 0 ? "bg-base-100" : "bg-base-200/50"}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium capitalize text-base-content">
                      {`${e.patron.firstName} ${e.patron.lastName}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/60">
                      —
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/60">
                      —
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                      {dayjs(e.createdAt).format("MMM DD, YYYY")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                      {dayjs(e.createdAt).format("h:mm A")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-base-content/70">
                      {e.createdBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-success/20 px-2 py-1 text-xs font-medium text-success">
                        Member
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {e.isVoided ? (
                        <span className="inline-flex rounded-full bg-error/20 px-2 py-1 text-xs font-medium text-error">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-success/20 px-2 py-1 text-xs font-medium text-success">
                          Active
                        </span>
                      )}
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

type ItemChangeLogTableProps = {
  data: RouterOutputs["reports"]["getNew"]["itemChangeLogReport"];
  children?: ReactElement[] | ReactElement;
};

export const ItemChangeLogTable = forwardRef<
  HTMLDivElement,
  ItemChangeLogTableProps
>(function ItemChangeLogTable(
  props: ItemChangeLogTableProps,
  ref: Ref<HTMLDivElement>,
) {
  const { data } = props;

  return (
    <div className="space-y-6" ref={ref}>
      {/* Header Section */}
      <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-base-content">
              Item Change Log Report
            </h1>
            <p className="mt-1 text-sm text-base-content/70">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 print:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">Total Changes</p>
              <p className="text-2xl font-semibold text-base-content">
                {data?.changeLogs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-success/10 p-3">
              <svg
                className="h-6 w-6 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Items Modified
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {new Set(data?.changeLogs.map((log) => log.itemId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-secondary/10 p-3">
              <svg
                className="h-6 w-6 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">Users Active</p>
              <p className="text-2xl font-semibold text-base-content">
                {new Set(data?.changeLogs.map((log) => log.userId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-base-300 bg-base-100 p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-warning/10 p-3">
              <svg
                className="h-6 w-6 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-base-content/70">
                Avg Changes/Day
              </p>
              <p className="text-2xl font-semibold text-base-content">
                {data?.changeLogs.length && data?.startDate && data?.endDate
                  ? Math.round(
                      data.changeLogs.length /
                        Math.max(
                          1,
                          dayjs(data.endDate).diff(
                            dayjs(data.startDate),
                            "day",
                          ) + 1,
                        ),
                    )
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Log Table */}
      <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
        <div className="border-b border-base-300 px-6 py-4">
          <h3 className="text-lg font-medium text-base-content">
            Change Log Details
          </h3>
          <p className="mt-1 text-sm text-base-content/70">
            Complete list of all item modifications
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-200/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Change Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Modified By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300 bg-base-100">
              {data?.changeLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={index % 2 === 0 ? "bg-base-100" : "bg-base-200/50"}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-base-content">
                    {log.item.label}
                  </td>
                  <td className="px-6 py-4 text-sm text-base-content/70">
                    <div
                      className="max-w-xs truncate"
                      title={log.changeNote ?? "No note provided"}
                    >
                      {log.changeNote ?? "No note provided"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                    {log.userId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                    {dayjs(log.createdAt).format("MMM DD, YYYY")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-base-content/70">
                    {dayjs(log.createdAt).format("h:mm A")}
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

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "purchase" | "admission" | "itemchangelog"
  >("purchase");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const startDate = dateRange?.[0]?.toDate() ?? new Date();
  const endDate = dateRange?.[1]?.endOf("day").toDate() ?? new Date();

  const purchaseReport: RouterInputs["reports"]["getNew"]["purchaseReport"] = {
    startDate,
    endDate,
    includeAdmissions: false,
    includeConcessions: true,
  };
  const admissionReport: RouterInputs["reports"]["getNew"]["admissionReport"] =
    {
      startDate,
      endDate,
    };
  const itemChangeLogReport: RouterInputs["reports"]["getNew"]["itemChangeLogReport"] =
    {
      startDate,
      endDate,
    };

  const { data, isFetching } = api.reports.getNew.useQuery(
    {
      purchaseReport,
      admissionReport,
      timecardReport: null,
      itemChangeLogReport,
    },
    {
      enabled: !!dateRange,
      onError: handleApiError,
    },
  );

  const presets: { label: string; range: () => [Dayjs, Dayjs] }[] = [
    {
      label: "Today",
      range: () => [dayjs().startOf("day"), dayjs()],
    },
    {
      label: "Yesterday",
      range: () => [
        dayjs().subtract(1, "day").startOf("day"),
        dayjs().subtract(1, "day").endOf("day"),
      ],
    },
    {
      label: "Last 7 Days",
      range: () => [dayjs().subtract(6, "day").startOf("day"), dayjs()],
    },
    {
      label: "Last 30 Days",
      range: () => [dayjs().subtract(29, "day").startOf("day"), dayjs()],
    },
    {
      label: "This Month",
      range: () => [dayjs().startOf("month"), dayjs()],
    },
  ];

  const handlePreset = (p: (typeof presets)[number]) => {
    setSelectedPreset(p.label);
    const [s, e] = p.range();
    setDateRange([s, e]);
  };

  const handleCustomRange = (dates: RangeValueType<Dayjs>) => {
    setSelectedPreset(null);
    if (dates?.[0] && dates?.[1]) {
      setDateRange([dates[0], dates[1]]);
    }
  };

  const printHref =
    activeTab === "purchase"
      ? {
          pathname: "/reports/print/purchase" as const,
          query: {
            start: dateRange?.[0]?.toISOString(),
            end: dateRange?.[1]?.endOf("day").toISOString(),
            includeAdmissions: false,
            includeConcessions: true,
          },
        }
      : activeTab === "admission"
      ? {
          pathname: "/reports/print/admission" as const,
          query: {
            start: dateRange?.[0]?.toISOString(),
            end: dateRange?.[1]?.endOf("day").toISOString(),
          },
        }
      : {
          pathname: "/reports/print/itemChangeLog" as const,
          query: {
            start: dateRange?.[0]?.toISOString(),
            end: dateRange?.[1]?.endOf("day").toISOString(),
          },
        };

  const tabs = [
    { key: "purchase" as const, label: "Sales", emoji: "💰" },
    { key: "admission" as const, label: "Admissions", emoji: "🎟️" },
    { key: "itemchangelog" as const, label: "Changes", emoji: "📋" },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-base-200/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 shadow-md">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-base-100/20">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-primary-content"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-primary-content">
                  Reports
                </h1>
              </div>
              {dateRange && data && (
                <Link
                  href={printHref}
                  className="btn btn-sm gap-2 border-white/20 bg-base-100/20 text-primary-content hover:bg-base-100/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z"
                    />
                  </svg>
                  Print
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
            {/* Date presets + custom picker */}
            <div className="flex flex-wrap items-center gap-2">
              {presets.map((p) => (
                <button
                  key={p.label}
                  className={`btn btn-xs sm:btn-sm ${
                    selectedPreset === p.label ? "btn-primary" : "btn-ghost"
                  }`}
                  onClick={() => handlePreset(p)}
                >
                  {p.label}
                </button>
              ))}
              <div className="ml-auto">
                <RangePicker
                  value={dateRange}
                  onChange={handleCustomRange}
                  placeholder={["Start", "End"]}
                  size="small"
                />
              </div>
            </div>

            {/* Report tabs + date label */}
            <div className="flex items-center justify-between">
              <div className="join">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    className={`btn join-item btn-xs sm:btn-sm gap-1 ${
                      activeTab === t.key ? "btn-primary" : ""
                    }`}
                    onClick={() => setActiveTab(t.key)}
                  >
                    <span>{t.emoji}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
              {dateRange && (
                <span className="text-xs text-base-content/50">
                  {dateRange[0].format("MMM D")} —{" "}
                  {dateRange[1].format("MMM D, YYYY")}
                  {isFetching && (
                    <span className="loading loading-dots loading-xs ml-2" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          {/* Empty state */}
          {!dateRange && !isFetching && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 py-20">
              <div className="mb-4 text-5xl">📊</div>
              <h3 className="mb-2 text-lg font-semibold text-base-content">
                Pick a date range to get started
              </h3>
              <p className="mb-6 text-sm text-base-content/50">
                Use the quick presets above or select a custom range
              </p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handlePreset(presets[0]!)}
              >
                Start with Today
              </button>
            </div>
          )}

          {/* Loading (first fetch) */}
          {isFetching && !data && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 py-20">
              <LoadingSpinner />
              <p className="mt-4 text-sm text-base-content/60">
                Crunching the numbers…
              </p>
            </div>
          )}

          {/* Report content */}
          {data?.purchaseReport && activeTab === "purchase" && (
            <PurchaseReportTable data={data.purchaseReport} />
          )}
          {data?.admissionReport && activeTab === "admission" && (
            <AdmissionReportTable data={data.admissionReport} />
          )}
          {data?.itemChangeLogReport && activeTab === "itemchangelog" && (
            <ItemChangeLogTable data={data.itemChangeLogReport} />
          )}
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(ReportsPage, "admin");
