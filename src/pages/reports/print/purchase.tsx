import isAuth from "~/components/isAuth";

const PurchaseReportPrintPage = () => {
  return <div>purchase</div>;
};

export default isAuth(PurchaseReportPrintPage, "admin");
