import { type Dispatch, type SetStateAction, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/button";
import { LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

type PatronFormData = {
  firstName: string;
  lastName: string;
  birthDate?: Date;
};

const PatronFormSection = (props: {
  isSubmitting?: boolean;
  value: PatronFormData[];
  onChange: Dispatch<SetStateAction<PatronFormData[]>>;
}) => {
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<PatronFormData>();

  const onSubmit = (data: PatronFormData) => {
    props.onChange([...props.value, data]);
    setShowForm(false);
    reset();
  };

  return (
    <div className="flex flex-col gap-3">
      <>
        {props.value.map((p) => (
          <div
            className={`rounded-xl ${
              props.isSubmitting ? "bg-slate-300" : "bg-slate-50"
            } p-2 px-4 shadow-lg`}
            key={p.firstName + p.lastName}
          >
            {p.firstName}
          </div>
        ))}
      </>
      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
          <label className="text-xs font-medium">First Name</label>
          <input
            id="firstName"
            type="text"
            placeholder="Ex: John"
            className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
            {...register("firstName", {
              required: true,
              disabled: props.isSubmitting,
            })}
          />
          <label className="text-xs font-medium">Last Name</label>
          <input
            id="lastName"
            type="text"
            placeholder="Ex: Doe"
            className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
            {...register("lastName", {
              required: true,
              disabled: props.isSubmitting,
            })}
          />
          <label className="text-xs font-medium">Birth Date</label>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DatePicker
                className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
                placeholderText="Optional Birthday"
                selected={field.value}
                onChange={(date: Date) => field.onChange(date)}
              />
            )}
          />
          <div>
            <Button type="submit">Add</Button>
            <Button
              onClick={() => {
                setShowForm(false);
                reset();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <Button onClick={() => setShowForm((prev) => !prev)}>
            Add Patron
          </Button>
        </div>
      )}
    </div>
  );
};

type SeasonPassFormData = {
  label: string;
};

export default function SinglePassPage() {
  const [patrons, setPatrons] = useState<PatronFormData[]>([]);
  const { register, handleSubmit, reset, formState } =
    useForm<SeasonPassFormData>();
  const ctx = api.useUtils();
  const { mutate, isLoading } = api.passes.createSeasonPass.useMutation({
    onSuccess: () => {
      reset();
      setPatrons([]);
      void ctx.passes.getAll.invalidate();
    },
    onError: (e: { message: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const msg = JSON.parse(e.message)[0].message as string | undefined;
      if (msg) toast.error(msg);
    },
  });

  const onSubmit = (data: SeasonPassFormData) => {
    mutate({
      seasonPass: data,
      patrons,
    });
  };

  return (
    <div className="mx-auto flex w-1/2 flex-col gap-3">
      <h2 className="font-semibold underline">Patron Details</h2>
      <PatronFormSection
        value={patrons}
        onChange={setPatrons}
        isSubmitting={isLoading}
      />
      <h2 className="font-semibold underline">Pass Details</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <label className="text-xs font-medium">Label</label>
        <input
          id="label"
          placeholder="Ex: Johnson, Anderson, etc..."
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          {...register("label", {
            required: true,
            disabled: isLoading,
          })}
        />
        {isLoading ? (
          <div className="flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <Button disabled={!formState.isValid} type="submit">
            Create
          </Button>
        )}
      </form>
    </div>
  );
}
