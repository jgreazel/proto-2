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
  const { data, isLoading: isGettingUsers } =
    api.profile.getAllUsers.useQuery();

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
          className="select select-bordered capitalize"
          {...(register("userId"),
          {
            required: true,
            disabled: isLoading || isGettingUsers,
          })}
        >
          {data?.map((u) => (
            <option key={u.id} value={u.id} className="capitalize">
              {u.username}
            </option>
          ))}
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
