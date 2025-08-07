import { type ReactElement, type Ref, forwardRef, useState } from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import duration from "dayjs/plugin/duration";
import { useForm, Controller } from "react-hook-form";

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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Purchase Report
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-50 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
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
              <p className="text-sm font-medium text-gray-600">
                Active Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {dbUnitToDollars(data?.summary.concessionTotal ?? 0)}
              </p>
              <p className="text-xs text-gray-500">
                {data?.summary.concessionCount} items
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-red-50 p-3">
              <svg
                className="h-6 w-6 text-red-600"
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
              <p className="text-sm font-medium text-gray-600">Voided Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dbUnitToDollars(data?.summary.voidedConcessionTotal ?? 0)}
              </p>
              <p className="text-xs text-gray-500">
                {data?.summary.voidedConcessionCount} items voided
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-50 p-3">
              <svg
                className="h-6 w-6 text-green-600"
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
              <p className="text-sm font-medium text-gray-600">
                Total Transactions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.summary.totalTransactions ?? 0}
              </p>
              <p className="text-xs text-gray-500">
                {data?.summary.voidedTransactions ?? 0} voided
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-50 p-3">
              <svg
                className="h-6 w-6 text-purple-600"
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
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {dbUnitToDollars(
                  (data?.summary.concessionTotal ?? 0) -
                    (data?.summary.voidedConcessionTotal ?? 0),
                )}
              </p>
              <p className="text-xs text-gray-500">After voids</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Transaction Details
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Complete list of all purchase transactions
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Cashier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Void Info
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.transactions.map((transaction, index) => (
                <tr
                  key={transaction!.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"} ${
                    transaction!.isVoided ? "opacity-75" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">
                    #{transaction!.id.slice(-8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
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
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                    {dbUnitToDollars(transaction!.total)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    <div>
                      <div>
                        {dayjs(transaction!.createdAt).format("MMM DD, YYYY")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dayjs(transaction!.createdAt).format("h:mm A")}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-600">
                    {transaction!.createdBy}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {transaction!.isVoided ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        VOIDED
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
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
                      <span className="text-gray-400">—</span>
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Admission Report
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-emerald-50 p-3">
              <svg
                className="h-6 w-6 text-emerald-600"
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
              <p className="text-sm font-medium text-gray-600">
                Member Admissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {memberCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-orange-50 p-3">
              <svg
                className="h-6 w-6 text-orange-600"
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
              <p className="text-sm font-medium text-gray-600">
                Non-Member Tickets
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {nonMemberCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-50 p-3">
              <svg
                className="h-6 w-6 text-green-600"
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
              <p className="text-sm font-medium text-gray-600">
                Ticket Revenue
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {dbUnitToDollars(nonMemberRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-50 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
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
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">
                {memberCount + nonMemberCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Admission Events Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Admission Details
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Complete list of all admission events and ticket sales
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Patron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.admissionEvents.map((e, index) =>
                e.type === "transaction" ? (
                  <tr
                    key={e.itemId}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      Non-member
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {e.amountSold}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {dbUnitToDollars(e.amountSold * e.item.sellingPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {dayjs(e.createdAt).format("MMM DD, YYYY")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {dayjs(e.createdAt).format("h:mm A")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-600">
                      {e.createdBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium capitalize text-orange-800">
                        {e.item.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={e.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium capitalize text-gray-900">
                      {`${e.patron.firstName} ${e.patron.lastName}`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      —
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      —
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {dayjs(e.createdAt).format("MMM DD, YYYY")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {dayjs(e.createdAt).format("h:mm A")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-gray-600">
                      {e.createdBy}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                        Member
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {e.isVoided ? (
                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Voided
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Item Change Log Report
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {dayjs(data?.startDate).format("MMMM DD, YYYY")} -{" "}
              {dayjs(data?.endDate).format("MMMM DD, YYYY")}
            </p>
          </div>
          <div className="flex items-center space-x-3">{props.children}</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-6 print:grid-cols-4 print:gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-50 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
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
              <p className="text-sm font-medium text-gray-600">Total Changes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {data?.changeLogs.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-50 p-3">
              <svg
                className="h-6 w-6 text-green-600"
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
              <p className="text-sm font-medium text-gray-600">
                Items Modified
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(data?.changeLogs.map((log) => log.itemId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-50 p-3">
              <svg
                className="h-6 w-6 text-purple-600"
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
              <p className="text-sm font-medium text-gray-600">Users Active</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(data?.changeLogs.map((log) => log.userId)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="rounded-lg bg-orange-50 p-3">
              <svg
                className="h-6 w-6 text-orange-600"
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
              <p className="text-sm font-medium text-gray-600">
                Avg Changes/Day
              </p>
              <p className="text-2xl font-semibold text-gray-900">
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
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Change Log Details
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Complete list of all item modifications
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Change Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Modified By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.changeLogs.map((log, index) => (
                <tr
                  key={log.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {log.item.label}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div
                      className="max-w-xs truncate"
                      title={log.changeNote ?? "No note provided"}
                    >
                      {log.changeNote ?? "No note provided"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {log.userId}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {dayjs(log.createdAt).format("MMM DD, YYYY")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
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

type ReportData = {
  dateRange: RangeValueType<Dayjs>;
};

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "purchase" | "admission" | "itemchangelog"
  >("purchase");
  const { handleSubmit, control, watch } = useForm<ReportData>();
  const formVals = watch();

  const startDate = formVals.dateRange?.[0]?.toDate() ?? new Date();
  const endDate = formVals.dateRange?.[1]?.endOf("day").toDate() ?? new Date();

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

  const { data, refetch } = api.reports.getNew.useQuery(
    {
      purchaseReport,
      admissionReport,
      timecardReport: null,
      itemChangeLogReport,
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
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Reports & Analytics
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Generate and view detailed business reports
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <svg
                  className="h-8 w-8 text-gray-400"
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
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Date Selection - Primary Control */}
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Select Date Range
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Choose the date range for all reports
              </p>
            </div>

            {/* Date Range Form */}
            <form onSubmit={handleSubmit(submit)} className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <Controller
                    control={control}
                    name="dateRange"
                    render={({ field }) => (
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Report Date Range
                        </label>
                        <RangePicker
                          value={field.value}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          onChange={(dates) => field.onChange(dates)}
                          placeholder={["Start Date", "End Date"]}
                        />
                      </div>
                    )}
                  />
                </div>
                <div className="flex-shrink-0">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn btn-primary ${loading ? "loading" : ""}`}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="mr-2 h-4 w-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
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
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Generate Reports
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Report Results */}
          {loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="font-medium text-gray-600">
                  Generating your report...
                </p>
                <p className="text-sm text-gray-500">
                  This may take a few moments
                </p>
              </div>
            </div>
          )}

          {!showReport && !loading && (
            <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
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
                <div className="text-center">
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No Report Generated
                  </h3>
                  <p className="text-gray-600">
                    Select a date range and click &quot;Generate Report&quot; to
                    view your data
                  </p>
                </div>
              </div>
            </div>
          )}

          {showReport && data && (
            <>
              {/* Report Tabs */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Report Results
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Switch between different report views
                  </p>
                </div>
                <div className="p-6">
                  <nav className="flex space-x-8" aria-label="Report tabs">
                    <button
                      onClick={() => setActiveTab("purchase")}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                        activeTab === "purchase"
                          ? "border-primary text-primary"
                          : "border-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-4 w-4"
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
                        <span>Concessions Report</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("admission")}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                        activeTab === "admission"
                          ? "border-primary text-primary"
                          : "border-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-4 w-4"
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
                        <span>Admission Report</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("itemchangelog")}
                      className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                        activeTab === "itemchangelog"
                          ? "border-primary text-primary"
                          : "border-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          className="h-4 w-4"
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
                        <span>Item Change Log</span>
                      </div>
                    </button>
                  </nav>
                </div>
              </div>
            </>
          )}

          {/* Individual Report Views */}
          {showReport && data?.purchaseReport && activeTab === "purchase" && (
            <PurchaseReportTable data={data.purchaseReport}>
              <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Link
                  href={{
                    pathname: "/reports/print/purchase",
                    query: {
                      start: formVals.dateRange?.[0]?.toISOString(),
                      end: formVals.dateRange?.[1]?.endOf("day").toISOString(),
                      includeAdmissions: false,
                      includeConcessions: true,
                    },
                  }}
                  className="flex items-center"
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
                  Print Report
                </Link>
              </button>
            </PurchaseReportTable>
          )}

          {showReport && data?.admissionReport && activeTab === "admission" && (
            <AdmissionReportTable data={data.admissionReport}>
              <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Link
                  href={{
                    pathname: "/reports/print/admission",
                    query: {
                      start: formVals.dateRange?.[0]?.toISOString(),
                      end: formVals.dateRange?.[1]?.endOf("day").toISOString(),
                    },
                  }}
                  className="flex items-center"
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
                  Print Report
                </Link>
              </button>
            </AdmissionReportTable>
          )}

          {showReport &&
            data?.itemChangeLogReport &&
            activeTab === "itemchangelog" && (
              <ItemChangeLogTable data={data.itemChangeLogReport}>
                <button className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  <Link
                    href={{
                      pathname: "/reports/print/itemChangeLog",
                      query: {
                        start: formVals.dateRange?.[0]?.toISOString(),
                        end: formVals.dateRange?.[1]
                          ?.endOf("day")
                          .toISOString(),
                      },
                    }}
                    className="flex items-center"
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
                    Print Report
                  </Link>
                </button>
              </ItemChangeLogTable>
            )}
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(ReportsPage, "admin");
