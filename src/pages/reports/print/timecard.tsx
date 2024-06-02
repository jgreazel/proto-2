import isAuth from "~/components/isAuth";

const TimecardPrintPage = () => {
  return <div>timecard</div>;
};

export default isAuth(TimecardPrintPage, "admin");
