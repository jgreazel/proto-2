import { Controller, useForm } from "react-hook-form";
import { api } from "~/utils/api";

import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";

type ShiftFormData = {
  userId: string;
  start: Date;
  end: Date;
};

const ShiftForm = () => {
  const { mutate, isLoading } = api.schedules.createShift.useMutation({
    onError: handleApiError,
    onSuccess: () => {
      console.log("success!");
    },
  });
  const { register, handleSubmit } = useForm<ShiftFormData>();

  const submit = (data: ShiftFormData) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Assignee</span>
        </div>
        <select
          className="select select-bordered"
          {...(register("userId"),
          {
            required: true,
            disabled: isLoading,
          })}
        >
          {/* // todo get all users from api */}
        </select>
      </label>
    </form>
  );
};

export default function SchedulesPage() {
  return (
    <PageLayout>
      Schedules page
      <ShiftForm />
    </PageLayout>
  );
}
