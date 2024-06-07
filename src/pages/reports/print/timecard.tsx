import { useReactToPrint } from "react-to-print";

import isAuth from "~/components/isAuth";
import { TimecardReportTable } from "..";

const TimecardPrintPage = () => {
  return <div>timecard</div>;
};

export default isAuth(TimecardPrintPage, "admin");
