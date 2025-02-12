/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { LoadingPage } from "./loading";

type Role = "employee" | "admin";

// ? idk if HOC is the best implementation for auth
// ? context and hook w/ check___ fns?

// Auth settings steps:
// user (board member or manager) signs up for the app
// admin user (me or board member) goes to "UserManagement" module in app
// (user management is an admin feature like future events, announcements)
// (reports, user mgmt, etc access all sep permissions. maybe "admin" is just UI sections for grouping)
// admin user clicks to create an employee profile -> when complete, redirect to employee management module
// admin user assigns a title (from setup titles) and other settings/permissions
// (employee profile will contain title & permissions, claims should not overlap between the two categories)
// Now when that user logs in next:
// user & user.employeeProfile fetched on login, stored in FE context
// securityModule used to check title/permissions in components

// if titles are created by admin users, how can FE securityMod know which claims are allowed per title?
// admin user associates titleClaims with title on creation
// titleClaims != userClaims
// admin user can select a claim, but not create one. Claims are hard coded from app functionality (may request new ones)

// decide on verbiage: settings / permission / claim / config

export default function isAuth(Component: any, role?: Role) {
  return function _isAuth(props: any) {
    // todo convert to FE context, store user.employeeProfile for entire session
    const { data, isLoading } = api.profile.getSettingsByUser.useQuery();
    const router = useRouter();

    if (isLoading) return <LoadingPage />;

    // todo check employee profile, not user
    // don't need to address "employee". If they have data but aren't admin, they're an "employee"
    const isNotAllowed = data && !data.isAdmin && role === "admin";
    if (!data || isNotAllowed) {
      // is voiding this causing the blink?
      void router.push("/unauthorized");
    }

    return <Component {...props} />;
  };
}
