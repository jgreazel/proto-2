/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { LoadingPage } from "./loading";

export default function isAuth(Component: any) {
  return function _isAuth(props: any) {
    const { data, isLoading } = api.profile.getSettingsByUser.useQuery();
    const router = useRouter();

    if (isLoading) return <LoadingPage />;

    if (!data) {
      // is voiding this causing the blink?
      void router.push("/unauthorized");
    }

    return <Component {...props} />;
  };
}
