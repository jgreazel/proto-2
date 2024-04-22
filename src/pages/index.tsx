import { LinkListItems, PageLayout } from "~/components/layout";
import Link from "next/link";
import Welcome from "~/components/welcome";
import { useUser } from "@clerk/nextjs";
import isAuth from "~/components/isAuth";

function HomePage() {
  const { user } = useUser();
  return (
    <PageLayout>
      <div className="p-4">
        <ul className="menu flex flex-row justify-evenly gap-2">
          <LinkListItems />
        </ul>
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
            <h1 className="p-3 text-lg font-medium">Common Tasks:</h1>
            <div className="flex flex-col">
              <Link className="btn btn-ghost btn-wide" href="checkout">
                Sell Concessions and Passes
              </Link>
              <Link className="btn btn-ghost btn-wide" href="items/restock">
                Receive a Shipment
              </Link>
              <Link className="btn btn-ghost btn-wide" href="passes/0">
                Create a New Season Pass
              </Link>
              <Link className="btn btn-ghost btn-wide" href="reports">
                Analyze Data
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default isAuth(HomePage);
