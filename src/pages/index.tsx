import { PageLayout } from "~/components/layout";
import Link from "next/link";
import Welcome from "~/components/welcome";
import { useUser } from "@clerk/nextjs";
import isAuth from "~/components/isAuth";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";

function HomePage() {
  const { user } = useUser();
  // for common tasks
  const { data, isLoading } = api.profile.getSettingsByUser.useQuery();

  const adminLinks = (
    <>
      <Link className="btn btn-ghost btn-wide" href="items/restock">
        Receive a Shipment
      </Link>
      <Link className="btn btn-ghost btn-wide" href="reports">
        Analyze Data
      </Link>
      <Link className="btn btn-ghost btn-wide" href="files">
        Upload an Image / File
      </Link>
      <Link className="btn btn-ghost btn-wide" href="schedules">
        Create a Schedule
      </Link>
    </>
  );

  const employeeLinks = (
    <>
      <Link className="btn btn-ghost btn-wide" href="checkout">
        Sell Snacks and Day Passes
      </Link>
      <Link className="btn btn-ghost btn-wide" href="passes/0">
        Create a New Season Pass
      </Link>
      <Link className="btn btn-ghost btn-wide" href="schedules">
        Check my Schedule
      </Link>
      <Link className="btn btn-ghost btn-wide" href="timeclock">
        Clock In
      </Link>
    </>
  );

  const commonTasks = !!data?.isAdmin ? adminLinks : employeeLinks;

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="p-4">
          {/* <ul className="menu flex flex-row justify-evenly gap-2">
            <LinkListItems />
          </ul> */}
          <div className="divider"></div>
          <div className="flex flex-col gap-4 p-2 md:flex-row">
            <div className="card card-compact w-full shadow-lg ">
              <div className="card-body">
                {!!user?.username ? (
                  <div className="card-title capitalize">
                    Hi, {user?.username}
                  </div>
                ) : (
                  <div></div>
                )}
                <Welcome />
              </div>
            </div>
            <div className="rounded-lg bg-base-100 p-2 shadow-lg">
              <h1 className="p-3 text-lg font-medium">I need to...</h1>
              <div className="flex flex-col">{commonTasks}</div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(HomePage, "employee");
