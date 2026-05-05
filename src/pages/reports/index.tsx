import { type ReactElement, type Ref, forwardRef, useState, useMemo } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

// ── Helper: CSV export ──────────────────────────────────
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Helper: delta badge ─────────────────────────────────
function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return <span className="badge badge-success badge-xs ml-1">New</span>;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return <span className="badge badge-ghost badge-xs ml-1">—</span>;
  return (
    <span className={`badge badge-xs ml-1 ${pct > 0 ? "badge-success" : "badge-error"}`}>
      {pct > 0 ? "↑" : "↓"}{Math.abs(pct)}%
    </span>
  );
}

// ── Presets ──────────────────────────────────────────────
const PRESETS: { label: string; range: () => [Dayjs, Dayjs] }[] = [
  { label: "Today", range: () => [dayjs().startOf("day"), dayjs()] },
  {
    label: "Yesterday",
    range: () => [
      dayjs().subtract(1, "day").startOf("day"),
      dayjs().subtract(1, "day").endOf("day"),
    ],
  },
  { label: "Last 7 Days", range: () => [dayjs().subtract(6, "day").startOf("day"), dayjs()] },
  { label: "Last 30 Days", range: () => [dayjs().subtract(29, "day").startOf("day"), dayjs()] },
  { label: "This Month", range: () => [dayjs().startOf("month"), dayjs()] },
];

type TabKey = "overview" | "purchase" | "admission" | "itemchangelog" | "hours";

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>([
    dayjs().startOf("day"),
    dayjs(),
  ]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>("Today");
  const [comparing, setComparing] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedMenu, setShowSavedMenu] = useState(false);

  const startDate = dateRange?.[0]?.toDate() ?? new Date();
  const endDate = dateRange?.[1]?.endOf("day").toDate() ?? new Date();

  // Compute previous period (same duration, shifted back)
  const duration = dateRange
    ? dateRange[1].diff(dateRange[0], "millisecond")
    : 0;
  const prevStart = dateRange
    ? dateRange[0].subtract(duration + 1, "millisecond").startOf("day").toDate()
    : new Date();
  const prevEnd = dateRange
    ? dateRange[0].subtract(1, "millisecond").toDate()
    : new Date();

  const queryInput = {
    purchaseReport: { startDate, endDate, includeAdmissions: true, includeConcessions: true } as RouterInputs["reports"]["getNew"]["purchaseReport"],
    admissionReport: { startDate, endDate } as RouterInputs["reports"]["getNew"]["admissionReport"],
    timecardReport: null,
    itemChangeLogReport: { startDate, endDate } as RouterInputs["reports"]["getNew"]["itemChangeLogReport"],
  };

  const { data, isFetching } = api.reports.getNew.useQuery(queryInput, {
    enabled: !!dateRange,
    onError: handleApiError,
  });

  const { data: prevData } = api.reports.getNew.useQuery(
    {
      purchaseReport: { startDate: prevStart, endDate: prevEnd, includeAdmissions: true, includeConcessions: true },
      admissionReport: { startDate: prevStart, endDate: prevEnd },
      timecardReport: null,
      itemChangeLogReport: { startDate: prevStart, endDate: prevEnd },
    },
    {
      enabled: !!dateRange && comparing,
      onError: handleApiError,
    },
  );

  // ── Saved reports ───────────────────────────────────────
  const { data: savedReports, refetch: refetchSaved } =
    api.reports.getSavedReports.useQuery();
  const { mutate: createSaved } = api.reports.createSavedReport.useMutation({
    onSuccess: () => {
      toast.success("Report saved");
      setShowSaveModal(false);
      setSaveName("");
      void refetchSaved();
    },
    onError: handleApiError,
  });
  const { mutate: deleteSaved } = api.reports.deleteSavedReport.useMutation({
    onSuccess: () => {
      toast.success("Deleted");
      void refetchSaved();
    },
    onError: handleApiError,
  });

  const handlePreset = (p: (typeof PRESETS)[number]) => {
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

  const loadSaved = (s: NonNullable<typeof savedReports>[number]) => {
    if (s.datePreset) {
      const preset = PRESETS.find((p) => p.label === s.datePreset);
      if (preset) handlePreset(preset);
    } else if (s.customStart && s.customEnd) {
      setSelectedPreset(null);
      setDateRange([dayjs(s.customStart), dayjs(s.customEnd)]);
    }
    setActiveTab(s.reportType as TabKey);
    setShowSavedMenu(false);
  };

  // ── Charts data ─────────────────────────────────────────
  const dailyRevenue = useMemo(() => {
    if (!data?.purchaseReport?.transactions) return [];
    const byDay: Record<string, number> = {};
    data.purchaseReport.transactions.forEach((t) => {
      if (!t) return;
      if (!t.isVoided) {
        const day = dayjs(t.createdAt).format("MMM D");
        byDay[day] = (byDay[day] ?? 0) + t.total;
      }
    });
    return Object.entries(byDay).map(([day, cents]) => ({
      day,
      revenue: cents / 100,
    }));
  }, [data?.purchaseReport?.transactions]);

  const dailyAdmissions = useMemo(() => {
    if (!data?.admissionReport?.admissionEvents) return [];
    const byDay: Record<string, { members: number; tickets: number }> = {};
    data.admissionReport.admissionEvents.forEach((e) => {
      const day = dayjs(e.createdAt).format("MMM D");
      if (!byDay[day]) byDay[day] = { members: 0, tickets: 0 };
      if (e.type === "admission") byDay[day]!.members++;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      else byDay[day]!.tickets += e.amountSold ?? 1;
    });
    return Object.entries(byDay).map(([day, v]) => ({ day, ...v }));
  }, [data?.admissionReport?.admissionEvents]);

  // ── CSV export ──────────────────────────────────────────
  const handleExport = () => {
    if (activeTab === "purchase" && data?.purchaseReport) {
      const rows = [["ID", "Date", "Items", "Total", "Cashier", "Status", "Void Info"]];
      data.purchaseReport.transactions.forEach((t) => {
        if (!t) return;
        rows.push([
          `#${t.id.slice(-8)}`,
          dayjs(t.createdAt).format("MM/DD/YYYY h:mm A"),
          t.items.map((i) => `${i.amountSold}x ${i.label}`).join("; "),
          dbUnitToDollars(t.total),
          t.createdBy,
          t.isVoided ? "VOIDED" : "Completed",
          t.isVoided ? `${t.voidedBy ?? ""} - ${t.voidReason ?? ""}` : "",
        ]);
      });
      downloadCsv(`sales-report-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
    } else if (activeTab === "admission" && data?.admissionReport) {
      const rows = [["Patron", "Type", "Date", "Time", "Staff"]];
      data.admissionReport.admissionEvents.forEach((e) => {
        rows.push([
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          e.type === "admission" ? `${e.patron.firstName} ${e.patron.lastName}` : "Non-member",
          e.type === "admission" ? "Member" : "Ticket",
          dayjs(e.createdAt).format("MM/DD/YYYY"),
          dayjs(e.createdAt).format("h:mm A"),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          e.createdBy ?? "",
        ]);
      });
      downloadCsv(`admissions-report-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
    } else if (activeTab === "itemchangelog" && data?.itemChangeLogReport) {
      const rows = [["Item", "Change Note", "Modified By", "Date"]];
      data.itemChangeLogReport.changeLogs.forEach((l) => {
        rows.push([
          l.item.label,
          l.changeNote ?? "",
          l.userId,
          dayjs(l.createdAt).format("MM/DD/YYYY h:mm A"),
        ]);
      });
      downloadCsv(`changes-report-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
    } else if (activeTab === "hours" && hoursData) {
      const rows = [["Employee", "Clock In", "Clock Out", "Hours"]];
      hoursData.users.forEach((u) => {
        u.shifts.forEach((s) => {
          const h = s.minutesWorked !== null ? Math.floor(s.minutesWorked / 60) : "";
          const m = s.minutesWorked !== null ? Math.round(s.minutesWorked % 60) : "";
          rows.push([
            u.displayName,
            dayjs(s.clockIn).format("MM/DD/YYYY h:mm A"),
            s.clockOut ? dayjs(s.clockOut).format("MM/DD/YYYY h:mm A") : "Open",
            s.minutesWorked !== null ? `${h}h ${m}m` : "In Progress",
          ]);
        });
      });
      downloadCsv(`hours-report-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
    } else if (activeTab === "overview") {
      // Export summary as CSV
      const rows = [["Metric", "Value"]];
      const ps = data?.purchaseReport?.summary;
      const ar = data?.admissionReport;
      if (ps) {
        rows.push(["Revenue", dbUnitToDollars(ps.concessionTotal)]);
        rows.push(["Voided", dbUnitToDollars(ps.voidedConcessionTotal)]);
        rows.push(["Net Revenue", dbUnitToDollars(ps.concessionTotal - ps.voidedConcessionTotal)]);
        rows.push(["Transactions", String(ps.totalTransactions)]);
      }
      if (ar) {
        const members = ar.admissionEvents.filter((e) => e.type === "admission").length;
        rows.push(["Member Admissions", String(members)]);
        rows.push(["Total Entries", String(ar.admissionEvents.length)]);
      }
      downloadCsv(`overview-report-${dayjs().format("YYYY-MM-DD")}.csv`, rows);
    }
    toast.success("CSV downloaded");
  };

  // ── Print href ──────────────────────────────────────────
  const printHref =
    activeTab === "purchase" || activeTab === "overview"
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
      : activeTab === "hours"
      ? {
          pathname: "/reports/print/hours" as const,
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

  const tabs: { key: TabKey; label: string; desc: string }[] = [
    { key: "overview", label: "Overview", desc: "Dashboard with charts and key metrics from all reports" },
    { key: "purchase", label: "Sales", desc: "Concession sales, revenue, and voided transactions" },
    { key: "admission", label: "Admissions", desc: "Member check-ins and non-member ticket sales" },
    { key: "itemchangelog", label: "Changes", desc: "Inventory item price and stock modifications" },
    { key: "hours", label: "Hours", desc: "Staff hours worked recorded via the time clock" },
  ];

  // Summary helpers
  const ps = data?.purchaseReport?.summary;
  const admissionEvents = data?.admissionReport?.admissionEvents;
  const memberCount = admissionEvents?.filter((x) => x.type === "admission").length ?? 0;
  const ticketCount = admissionEvents
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ?.filter((x) => x.type === "transaction").reduce((s, x) => s + (x.amountSold as number), 0) ?? 0;
  const changeCount = data?.itemChangeLogReport?.changeLogs.length ?? 0;

  const { data: hoursData, isFetching: hoursFetching } = api.reports.getHoursReport.useQuery(
    { startDate, endDate },
    { enabled: !!dateRange && activeTab === "hours", onError: handleApiError },
  );

  // Previous period helpers (for comparison)
  const prevPs = prevData?.purchaseReport?.summary;
  const prevMember = prevData?.admissionReport?.admissionEvents?.filter((x) => x.type === "admission").length ?? 0;
  const prevTicket = prevData?.admissionReport?.admissionEvents
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ?.filter((x) => x.type === "transaction").reduce((s, x) => s + (x.amountSold as number), 0) ?? 0;

  return (
    <PageLayout>
      <div className="min-h-screen bg-base-200/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 shadow-md">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-primary-content">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-primary-content">Reports</h1>
              </div>
              <div className="flex items-center gap-2">
                {dateRange && (activeTab === "hours" ? !!hoursData : !!data) && activeTab !== "overview" && (
                  <button
                    className="btn btn-sm gap-1 border-white/20 bg-white/20 text-primary-content hover:bg-white/30"
                    onClick={handleExport}
                    title="Download current report as a spreadsheet-ready CSV file"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    CSV
                  </button>
                )}
                {dateRange && (activeTab === "hours" ? !!hoursData : !!data) && activeTab !== "overview" && (
                  <Link
                    href={printHref}
                    className="btn btn-sm gap-1 border-white/20 bg-white/20 text-primary-content hover:bg-white/30"
                    title="Open a print-friendly version of this report"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 12h.008v.008h-.008V12Zm-2.25 0h.008v.008H16.5V12Z" />
                    </svg>
                    Print
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Control Bar */}
        <div className="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 shadow-sm backdrop-blur">
          <div className="mx-auto max-w-7xl space-y-3 px-4 py-3 sm:px-6">
            {/* Date presets + saved reports + custom picker */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 rounded-lg border border-base-300 bg-base-200/50 p-1">
                {PRESETS.map((p) => (
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
              </div>

              {/* Saved reports dropdown */}
              <div className="relative">
                <button
                  className="btn btn-outline btn-xs sm:btn-sm gap-1"
                  onClick={() => setShowSavedMenu((v) => !v)}
                  title="Save this view for quick access later, or load a previously saved report"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                  </svg>
                  <span className="hidden sm:inline">Saved</span>
                  {savedReports?.length ? (
                    <span className="badge badge-primary badge-xs">{savedReports.length}</span>
                  ) : null}
                </button>
                {showSavedMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSavedMenu(false)} />
                    <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-base-300 bg-base-100 p-2 shadow-xl">
                      <div className="mb-2 flex items-center justify-between px-2">
                        <span className="text-xs font-semibold text-base-content/60">SAVED REPORTS</span>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => { setShowSavedMenu(false); setShowSaveModal(true); }}
                        >
                          + Save Current
                        </button>
                      </div>
                      {!savedReports?.length && (
                        <p className="px-2 py-3 text-center text-xs text-base-content/40">No saved reports yet</p>
                      )}
                      {savedReports?.map((s) => (
                        <div
                          key={s.id}
                          className="group flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 hover:bg-base-200"
                          onClick={() => loadSaved(s)}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-base-content/50">
                              {s.datePreset ?? "Custom range"} · {s.reportType}
                            </p>
                          </div>
                          <button
                            className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); deleteSaved({ id: s.id }); }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <RangePicker
                  value={dateRange}
                  onChange={handleCustomRange}
                  placeholder={["Start", "End"]}
                  size="small"
                />
              </div>
            </div>

            {/* Report tabs + date label + compare */}
            <div className="flex items-center justify-between">
              <div className="join">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    className={`btn join-item btn-xs sm:btn-sm ${
                      activeTab === t.key ? "btn-primary" : ""
                    }`}
                    onClick={() => setActiveTab(t.key)}
                    title={t.desc}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {dateRange && (
                <div className="flex items-center gap-3">
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      comparing
                        ? "border-secondary bg-secondary/10 text-secondary"
                        : "border-base-300 text-base-content/60 hover:border-base-content/30"
                    }`}
                    title={comparing
                      ? `Comparing to ${dayjs(prevStart).format("MMM D")} – ${dayjs(prevEnd).format("MMM D")}`
                      : "Compare with the previous period of the same length"}
                  >
                    <input
                      type="checkbox"
                      className="toggle toggle-xs toggle-secondary"
                      checked={comparing}
                      onChange={() => setComparing((v) => !v)}
                    />
                    {comparing
                      ? `Comparing vs ${dayjs(prevStart).format("MMM D")} – ${dayjs(prevEnd).format("MMM D")}`
                      : "Compare to previous period"}
                  </label>
                  <span className="text-xs text-base-content/50">
                    {dateRange[0].format("MMM D")} — {dateRange[1].format("MMM D, YYYY")}
                    {isFetching && <span className="loading loading-dots loading-xs ml-2" />}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

          {/* Loading */}
          {isFetching && !data && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 py-20">
              <LoadingSpinner />
              <p className="mt-4 text-sm text-base-content/60">Crunching the numbers…</p>
            </div>
          )}

          {/* ── OVERVIEW TAB ───────────────────────────── */}
          {data && activeTab === "overview" && (
            <div className="space-y-6">
              {/* Unified summary cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <SummaryCard
                  label="Total Revenue"
                  value={dbUnitToDollars((ps?.concessionTotal ?? 0) + (ps?.admissionTotal ?? 0))}
                  color="text-success"
                  delta={comparing && prevPs ? <DeltaBadge current={(ps?.concessionTotal ?? 0) + (ps?.admissionTotal ?? 0)} previous={(prevPs.concessionTotal ?? 0) + (prevPs.admissionTotal ?? 0)} /> : null}
                />
                <SummaryCard
                  label="Voided"
                  value={dbUnitToDollars((ps?.voidedConcessionTotal ?? 0) + (ps?.voidedAdmissionTotal ?? 0))}
                  color="text-error"
                  delta={comparing && prevPs ? <DeltaBadge current={(ps?.voidedConcessionTotal ?? 0) + (ps?.voidedAdmissionTotal ?? 0)} previous={(prevPs.voidedConcessionTotal ?? 0) + (prevPs.voidedAdmissionTotal ?? 0)} /> : null}
                />
                <SummaryCard
                  label="Net Revenue"
                  value={dbUnitToDollars((ps?.concessionTotal ?? 0) + (ps?.admissionTotal ?? 0) - (ps?.voidedConcessionTotal ?? 0) - (ps?.voidedAdmissionTotal ?? 0))}
                  color="text-primary"
                  delta={comparing && prevPs ? <DeltaBadge current={(ps?.concessionTotal ?? 0) + (ps?.admissionTotal ?? 0) - (ps?.voidedConcessionTotal ?? 0) - (ps?.voidedAdmissionTotal ?? 0)} previous={(prevPs.concessionTotal ?? 0) + (prevPs.admissionTotal ?? 0) - (prevPs.voidedConcessionTotal ?? 0) - (prevPs.voidedAdmissionTotal ?? 0)} /> : null}
                />
                <SummaryCard
                  label="Transactions"
                  value={String(ps?.totalTransactions ?? 0)}
                  delta={comparing && prevPs ? <DeltaBadge current={ps?.totalTransactions ?? 0} previous={prevPs.totalTransactions} /> : null}
                />
              </div>

              {/* Revenue breakdown */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Concession Sales"
                  value={dbUnitToDollars(ps?.concessionTotal ?? 0)}
                  delta={comparing && prevPs ? <DeltaBadge current={ps?.concessionTotal ?? 0} previous={prevPs.concessionTotal} /> : null}
                />
                <SummaryCard
                  label="Pass / Ticket Sales"
                  value={dbUnitToDollars(ps?.admissionTotal ?? 0)}
                  delta={comparing && prevPs ? <DeltaBadge current={ps?.admissionTotal ?? 0} previous={prevPs.admissionTotal ?? 0} /> : null}
                />
                <SummaryCard
                  label="Members In"
                  value={String(memberCount)}
                  color="text-info"
                  delta={comparing && prevData ? <DeltaBadge current={memberCount} previous={prevMember} /> : null}
                />
                <SummaryCard
                  label="Tickets Sold"
                  value={String(ticketCount)}
                  color="text-warning"
                  delta={comparing && prevData ? <DeltaBadge current={ticketCount} previous={prevTicket} /> : null}
                />
              </div>

              {/* Charts */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Revenue chart */}
                <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-base-content/70">Daily Revenue</h3>
                  {dailyRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dailyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--bc) / 0.1)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                        <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`, "Revenue"]} />
                        <Bar dataKey="revenue" fill="oklch(var(--su))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-base-content/40">No revenue data</div>
                  )}
                </div>

                {/* Admissions chart */}
                <div className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-base-content/70">Daily Admissions</h3>
                  {dailyAdmissions.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={dailyAdmissions}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--bc) / 0.1)" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="members" stroke="oklch(var(--in))" strokeWidth={2} name="Members" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="tickets" stroke="oklch(var(--wa))" strokeWidth={2} name="Tickets" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[220px] items-center justify-center text-sm text-base-content/40">No admission data</div>
                  )}
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <p className="text-xs font-medium uppercase text-base-content/50">Total Entries</p>
                  <p className="mt-1 text-2xl font-bold">{memberCount + ticketCount}</p>
                  {comparing && prevData && <DeltaBadge current={memberCount + ticketCount} previous={prevMember + prevTicket} />}
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <p className="text-xs font-medium uppercase text-base-content/50">Avg Transaction</p>
                  <p className="mt-1 text-2xl font-bold">
                    {ps && ps.totalTransactions > 0
                      ? dbUnitToDollars(Math.round(ps.concessionTotal / ps.totalTransactions))
                      : "$0.00"}
                  </p>
                </div>
                <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                  <p className="text-xs font-medium uppercase text-base-content/50">Item Changes</p>
                  <p className="mt-1 text-2xl font-bold">{changeCount}</p>
                </div>
              </div>

              {comparing && dateRange && (
                <p className="text-center text-xs text-base-content/40">
                  Comparing to {dayjs(prevStart).format("MMM D")} — {dayjs(prevEnd).format("MMM D, YYYY")}
                </p>
              )}
            </div>
          )}

          {/* Individual report tabs */}
          {data?.purchaseReport && activeTab === "purchase" && (
            <PurchaseReportTable data={data.purchaseReport} />
          )}
          {data?.admissionReport && activeTab === "admission" && (
            <AdmissionReportTable data={data.admissionReport} />
          )}
          {data?.itemChangeLogReport && activeTab === "itemchangelog" && (
            <ItemChangeLogTable data={data.itemChangeLogReport} />
          )}

          {/* ── HOURS TAB ──────────────────────────────── */}
          {activeTab === "hours" && (
            <div className="space-y-6">
              {hoursFetching && !hoursData && (
                <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 py-20">
                  <LoadingSpinner />
                  <p className="mt-4 text-sm text-base-content/60">Loading hours…</p>
                </div>
              )}
              {hoursData && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <SummaryCard
                      label="Total Staff Hours"
                      value={`${Math.floor(hoursData.totalMinutesAllStaff / 60)}h ${Math.round(hoursData.totalMinutesAllStaff % 60)}m`}
                      color="text-primary"
                    />
                    <SummaryCard
                      label="Employees Clocked"
                      value={String(hoursData.users.length)}
                    />
                    <SummaryCard
                      label="Open Shifts"
                      value={String(hoursData.users.filter((u) => u.openShift).length)}
                      color={hoursData.users.some((u) => u.openShift) ? "text-warning" : undefined}
                    />
                  </div>

                  {/* Per-employee breakdown */}
                  {hoursData.users.map((user) => {
                    const h = Math.floor(user.totalMinutes / 60);
                    const m = Math.round(user.totalMinutes % 60);
                    return (
                      <div key={user.userId} className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
                        <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
                          <div>
                            <h3 className="font-medium capitalize">{user.displayName}</h3>
                            <p className="text-xs text-base-content/60">
                              {user.totalMinutes > 0 ? `${h}h ${m}m total` : "No completed shifts"}
                              {user.openShift && (
                                <span className="ml-2 text-warning">● Currently clocked in</span>
                              )}
                            </p>
                          </div>
                          {user.totalMinutes > 0 && (
                            <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                              {h}h {m}m
                            </span>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-base-200">
                            <thead className="bg-base-200/50">
                              <tr>
                                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">#</th>
                                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Clock In</th>
                                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Clock Out</th>
                                <th className="px-6 py-2 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-base-200 bg-base-100">
                              {user.shifts.map((shift, idx) => {
                                const sh = shift.minutesWorked !== null ? Math.floor(shift.minutesWorked / 60) : null;
                                const sm = shift.minutesWorked !== null ? Math.round(shift.minutesWorked % 60) : null;
                                return (
                                  <tr key={idx} className={idx % 2 === 0 ? "bg-base-100" : "bg-base-200/30"}>
                                    <td className="px-6 py-3 text-sm text-base-content/40">{idx + 1}</td>
                                    <td className="px-6 py-3 text-sm">{dayjs(shift.clockIn).format("h:mm A")}</td>
                                    <td className="px-6 py-3 text-sm">
                                      {shift.clockOut ? (
                                        dayjs(shift.clockOut).format("h:mm A")
                                      ) : (
                                        <span className="badge badge-warning badge-sm">Open</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-3 text-sm font-medium">
                                      {sh !== null && sm !== null ? `${sh}h ${sm}m` : "—"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  {!hoursData.users.length && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 py-16 text-base-content/40">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="mt-2 text-sm">No time clock records for this period.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm">
            <h3 className="text-lg font-bold">Save Report</h3>
            <p className="mt-1 text-sm text-base-content/60">
              Save your current view for quick access later
            </p>
            <input
              className="input input-bordered mt-4 w-full"
              placeholder="Report name…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && saveName.trim()) {
                  createSaved({
                    name: saveName.trim(),
                    reportType: activeTab,
                    datePreset: selectedPreset,
                    customStart: selectedPreset ? null : dateRange?.[0]?.toDate(),
                    customEnd: selectedPreset ? null : dateRange?.[1]?.toDate(),
                  });
                }
              }}
            />
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!saveName.trim()}
                onClick={() =>
                  createSaved({
                    name: saveName.trim(),
                    reportType: activeTab,
                    datePreset: selectedPreset,
                    customStart: selectedPreset ? null : dateRange?.[0]?.toDate(),
                    customEnd: selectedPreset ? null : dateRange?.[1]?.toDate(),
                  })
                }
              >
                Save
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowSaveModal(false)} />
        </div>
      )}
    </PageLayout>
  );
}

// ── Summary Card component ──────────────────────────────
function SummaryCard({
  label,
  value,
  color,
  delta,
}: {
  label: string;
  value: string;
  color?: string;
  delta?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-base-content/50">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color ?? "text-base-content"}`}>
        {value}
        {delta}
      </p>
    </div>
  );
}

export default isAuth(ReportsPage, "admin");
