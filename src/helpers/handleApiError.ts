import { type TRPCClientErrorLike } from "@trpc/client/dist/TRPCClientError";
import toast from "react-hot-toast";
import { type AppRouter } from "~/server/api/root";

const handleApiError = (e: TRPCClientErrorLike<AppRouter>) => {
  const msg = e.message;
  toast.error(msg);
};

export default handleApiError;
