import { SignOutButton } from "@clerk/nextjs";
import Link from "next/link";

import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";

function UnauthorizedPage() {
  const { data, isLoading } = api.profile.getSettingsByUser.useQuery();

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <PageLayout>
      <div role="alert" className="alert mt-5 shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="h-6 w-6 shrink-0 stroke-info"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          {!data && (
            <>
              <h3 className="font-bold">Account Setup Not Finished</h3>
              <div className="text-xs">
                Contact an Admin to add User Permissions
              </div>
            </>
          )}
          {!!data && !data?.isAdmin && (
            <>
              <h3 className="font-bold">Not Authorized to view this page</h3>
              <div className="text-xs">
                Contact an Admin if you need permission
              </div>
            </>
          )}
        </div>

        {!data && (
          <div className="btn btn-outline btn-accent">
            <SignOutButton />
          </div>
        )}
        {!!data && !data?.isAdmin && (
          <Link href="/" className="btn btn-outline btn-primary">
            Back to Home
          </Link>
        )}
      </div>
    </PageLayout>
  );
}

export default UnauthorizedPage;
