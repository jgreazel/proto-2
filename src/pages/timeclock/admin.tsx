import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";

const TimeclockAdminView = () => {
  return (
    <PageLayout>
      <div>time clock admin view</div>
    </PageLayout>
  );
};

export default isAuth(TimeclockAdminView, "admin");
