/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { LoadingPage } from "./loading";

// Redirects to Home if the user is logged in
// So Authed users never see an UNauth screen
export default function isUnAuth(Component: any) {
  return function _isAuth(props: any) {
    const { data, isLoading } = api.profile.getSettingsByUser.useQuery();
    const router = useRouter();

    if (isLoading) return <LoadingPage />;

    if (data) {
      // is voiding this causing the blink?
      void router.push("/");
    }

    // should always be the Unauthorized page
    return <Component {...props} />;
  };
}
