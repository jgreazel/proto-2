import { type TRPCClientErrorLike } from "@trpc/client/dist/TRPCClientError";
import toast from "react-hot-toast";
import { type AppRouter } from "~/server/api/root";

const handleApiError = (e: TRPCClientErrorLike<AppRouter>) => {
  const msg =
    (JSON.parse(e.message) as TRPCClientErrorLike<AppRouter>[])[0]?.message ??
    "Server Error";
  toast.error(msg);
};

export default handleApiError;
