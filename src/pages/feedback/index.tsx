import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";
import { api, RouterInputs } from "~/utils/api";

type FeedbackForm = {
  message: string;
};

const FeedbackPage = () => {
  const { reset, register, handleSubmit } = useForm<FeedbackForm>();

  const { mutate, isLoading } = api.profile.leaveFeedback.useMutation({
    onError: handleApiError,
    onSuccess: () => {
      toast.success("Feedback recorded!");
      reset();
    },
  });

  const submit = (data: RouterInputs["profile"]["leaveFeedback"]) => {
    mutate(data);
  };

  return (
    <PageLayout>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(submit)}>
        <div className="font-medium">Leave Feedback</div>
        <textarea
          {...register("message", {
            required: true,
            minLength: 10,
            disabled: isLoading,
          })}
          className="textarea textarea-bordered w-full"
          placeholder="Experiencing bugs or have an idea?"
        ></textarea>
        <div className="flex justify-end">
          <button disabled={isLoading} className="btn btn-primary">
            Submit
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </form>
    </PageLayout>
  );
};
export default FeedbackPage;
