import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import Link from "next/link";
import { useState } from "react";

export default function ReportsPage() {
  // todo
  // input pry needs state / form
  // const {data, refetch, isLoading} = api.reports.useQuery({ startDate: _, endDate: _}, {enabled: false})

  return <PageLayout>Reports</PageLayout>;
}
