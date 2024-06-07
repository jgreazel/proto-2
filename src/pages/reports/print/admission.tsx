import { useReactToPrint } from "react-to-print";

import isAuth from "~/components/isAuth";
import { AdmissionReportTable } from "..";
import { PageLayout } from "~/components/layout";
import { useRouter } from "next/router";

const AdmissionReportPrintPage = () => {
  const router = useRouter();
  const { query } = router;

  console.log(query);

  return <PageLayout></PageLayout>;
};

export default isAuth(AdmissionReportPrintPage, "admin");
