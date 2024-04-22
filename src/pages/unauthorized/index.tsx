import { SignOutButton } from "@clerk/nextjs";
import isUnAuth from "~/components/isUnAuth";

import { PageLayout } from "~/components/layout";

function UnauthorizedPage() {
  return (
    <PageLayout disabled>
      <div role="alert" className="alert shadow-lg">
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
          <h3 className="font-bold">Account Setup Not Finished</h3>
          <div className="text-xs">
            Contact an Admin to add User Permissions
          </div>
        </div>
        <div className="btn btn-outline btn-accent">
          <SignOutButton />
        </div>
      </div>
    </PageLayout>
  );
}

export default isUnAuth(UnauthorizedPage);
