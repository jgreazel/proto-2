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

    const isNotAllowed = role === "admin" ? !data?.isAdmin : false;

    if (!data || isNotAllowed) {
      void router.push("/unauthorized");
    }

    return <Component {...props} />;
  };
}
