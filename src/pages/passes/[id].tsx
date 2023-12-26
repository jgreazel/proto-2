import {
  type Dispatch,
  type SetStateAction,
  useState,
  useEffect,
  ReactElement,
} from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/button";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";
import DatePicker from "react-datepicker";
import handleApiError from "~/helpers/handleApiError";

import "react-datepicker/dist/react-datepicker.css";
import { useParams } from "next/navigation";
import { TRPCClientError, TRPCClientErrorLike } from "@trpc/client";
import { AppRouter } from "~/server/api/root";

// todo need componenet to manage state between trash icon and "Reasign to which season pass?: <Select> <Button>Submit"
// and also handle updatePatron(newPassId) & getAllseasonpasses for their Ids for options
const ReassignNode = () => {
  const [showSelect, setShowSelect] = useState(false);

  return (
    <div>
      <div
        onClick={() => {
          // todo
          // if isEditing: needs to be reassinged, if notediting can just be dropped
        }}
        className="text-sm text-slate-400 hover:underline"
      >
        Remove
      </div>
    </div>
  );
};

type PatronFormData = {
  firstName: string;
  lastName: string;
  birthDate: Date | null;
};

const PatronFormSection = (props: {
  isLoading?: boolean;
  value: PatronFormData[];
  onChange: Dispatch<SetStateAction<PatronFormData[]>>;
  isEditing?: boolean;
  passId?: string;
  children?: ReactElement;
}) => {
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, control, reset } = useForm<PatronFormData>();

  const onAdd = (data: PatronFormData) => {
    props.onChange([...props.value, data]);
    setShowForm(false);
    reset();
  };

  const { mutate, isLoading: isCreating } = api.passes.createPatron.useMutation(
    {
      onSuccess: onAdd,
      onError: handleApiError,
    },
  );

  const onSubmit = (data: PatronFormData) => {
    if (props.isEditing) {
      mutate({ ...data, passId: props.passId! });
    } else {
      onAdd(data);
    }
  };

  const isGray = props.isLoading ?? isCreating;

  return (
    <div className="flex flex-col gap-3">
      <>
        {!!props.value.length ? (
          props.value.map((p) => (
            <div
              className={`rounded-xl ${
                isGray ? "bg-slate-300" : "bg-slate-50"
              } flex flex-row p-2 px-4 shadow-lg`}
              key={p.firstName + p.lastName}
            >
              {p.firstName}
              <div className="grow" />
              {props.children}
            </div>
          ))
        ) : (
          <div className="text-md text-sky-950">
            You haven&apos;t added any swimmers to your pass yet!
          </div>
        )}
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
              disabled: isGray,
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
              disabled: isGray,
            })}
          />
          <label className="text-xs font-medium">Birth Date</label>
          <Controller
            control={control}
            name="birthDate"
            render={({ field }) => (
              <DatePicker
                className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
                placeholderText="Birthday (Optional)"
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
          <Button
            onClick={() => setShowForm((prev) => !prev)}
            disabled={isGray}
          >
            + Add Patron
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
  const params = useParams();
  const id = (id: string | string[] | undefined = params?.id) =>
    id?.toString() ?? "0";
  const isEditing = id() !== "0";

  const { data, isLoading } = api.passes.getById.useQuery(
    { id: id() },
    { enabled: isEditing },
  );
  const isReallyLoading = isLoading && isEditing;

  const [patrons, setPatrons] = useState<PatronFormData[]>([]);

  const { register, handleSubmit, reset, formState } =
    useForm<SeasonPassFormData>();
  useEffect(() => {
    if (data && !isReallyLoading) {
      reset({ label: data.label });
      setPatrons(
        data.patrons.map((p) => ({
          firstName: p.firstName,
          lastName: p.lastName,
          birthDate: p.birthDate,
        })),
      );
    }
  }, [isReallyLoading, data, reset]);

  const ctx = api.useUtils();
  const { mutate: editMutate, isLoading: isUpdating } =
    api.passes.updateSeasonPass.useMutation({
      onSuccess: (data) => {
        void ctx.passes.getById.invalidate({
          id: data.id,
        });
      },
      onError: handleApiError,
    });
  const { mutate: createMutate, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: () => {
        reset();
        setPatrons([]);
        void ctx.passes.getAll.invalidate();
      },
      onError: handleApiError,
    });

  const onSubmit = (data: SeasonPassFormData) => {
    if (isEditing) {
      editMutate({
        id: id(),
        label: data.label,
      });
    } else {
      createMutate({
        seasonPass: data,
        patrons,
      });
    }
  };

  const isMutating = isCreating || isUpdating;

  return (
    <div className="mx-auto flex w-1/2 flex-col gap-3">
      <h2 className="font-semibold underline">Patron Details</h2>
      {isReallyLoading ? (
        <LoadingPage />
      ) : (
        <>
          <PatronFormSection
            value={patrons}
            onChange={setPatrons}
            isLoading={isMutating}
            isEditing={isEditing}
            passId={id()}
          >
           {isEditing ?<ReassignNode /> :<div         className="text-sm text-slate-400 hover:underline"
onClick={()=>}>Delete</div>}
          </PatronFormSection>
          <h2 className="font-semibold underline">Pass Details</h2>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <label className="text-xs font-medium">Label / Family Name</label>
            <input
              id="label"
              placeholder="Ex: Johnson, Anderson, etc..."
              className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
              {...register("label", {
                required: true,
                disabled: isMutating,
              })}
            />
            {isMutating ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <Button disabled={!formState.isValid} type="submit">
                {isEditing ? "Update" : "Create"}
              </Button>
            )}
          </form>
        </>
      )}
    </div>
  );
}
