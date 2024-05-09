/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { LoadingPage } from "./loading";

type Role = "employee" | "admin";

export default function isAuth(Component: any, role?: Role) {
  return function _isAuth(props: any) {
    const { data, isLoading } = api.profile.getSettingsByUser.useQuery();
    const router = useRouter();

    if (isLoading) return <LoadingPage />;

    // don't need to address "employee". If they have data but aren't admin, they're an "employee"
    const isNotAllowed = data && !data.isAdmin && role === "admin";
    if (!data || isNotAllowed) {
      // is voiding this causing the blink?
      void router.push("/unauthorized");
    }

    return <Component {...props} />;
  };
}
