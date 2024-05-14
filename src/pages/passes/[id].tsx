import { type Dispatch, type SetStateAction, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { Select } from "antd";

import { type RouterOutputs, api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import PatronForm, { type PatronFormData } from "~/components/patronForm";
import { PageLayout } from "~/components/layout";
import isAuth from "~/components/isAuth";

const ReassignNode = (props: { patronId: string; onSubmit: () => void }) => {
  const [showRemove, setShowRemove] = useState(true);
  const [select, setSelect] = useState<{ label: string; value: string }>();
  const { data, isLoading: isFetching } = api.passes.getAll.useQuery();
  const { mutate, isLoading: isUpdating } = api.passes.updatePatron.useMutation(
    {
      onError: handleApiError,
      onSuccess: () => {
        setShowRemove(true);
        toast.success("Patron Moved!");
        props.onSubmit();
      },
    },
  );

  const options =
    data
      ?.filter((pass) => !pass.patrons.some((p) => p.id === props.patronId))
      .map((o) => ({ label: o.label, value: o.id })) ?? [];

  return (
    <div>
      {showRemove ? (
        <div className="tooltip tooltip-left" data-tip="Remove from pass">
          <button
            className="btn btn-circle btn-ghost btn-sm"
            onClick={() => {
              setShowRemove(false);
            }}
          >
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
                d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
              />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={() => {
              setShowRemove(true);
            }}
            className="btn btn-circle btn-ghost btn-sm"
          >
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            disabled={isUpdating || !select}
            onClick={() => {
              mutate({
                id: props.patronId,
                // idk why its a string when everywhere thinks its a obj
                passId: select as unknown as string,
              });
            }}
            className="btn btn-circle btn-ghost btn-sm"
          >
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
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </button>
          <Select
            value={select}
            onChange={(newValue) => {
              setSelect(newValue);
            }}
            placeholder="Move to what pass?"
            options={options}
            disabled={isFetching}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      )}
    </div>
  );
};

const PatronFormSection = (props: {
  isLoading?: boolean;
  value: RouterOutputs["passes"]["createPatron"][];
  onChange: Dispatch<SetStateAction<RouterOutputs["passes"]["createPatron"][]>>;
  isEditing?: boolean;
  passId?: string;
}) => {
  const [showForm, setShowForm] = useState(false);

  function onAdd<
    T extends PatronFormData | RouterOutputs["passes"]["createPatron"],
  >(data: T) {
    props.onChange([
      ...props.value,
      {
        ...data,
        birthDate: dayjs(data.birthDate).toDate(),
        id: data.id ?? "",
        createdAt: "createdAt" in data ? data.createdAt : new Date(),
        createdBy: "createdBy" in data ? data.createdBy : "",
        passId: "passId" in data ? data.passId : "",
        banReEntryDate: "banReEntryDate" in data ? data.banReEntryDate : null,
      },
    ]);
    setShowForm(false);
  }

  const { mutate, isLoading: isCreating } = api.passes.createPatron.useMutation(
    {
      onSuccess: onAdd,
      onError: handleApiError,
    },
  );

  const onSubmit = (data: PatronFormData) => {
    if (props.isEditing) {
      mutate({
        ...data,
        passId: props.passId!,
        birthDate: data.birthDate?.toDate(),
      });
      toast.success(`Success!`);
    } else {
      onAdd(data);
    }
  };

  const isGray = props.isLoading ?? isCreating;

  const removeFromState = (id: number) => {
    const copy = [...props.value];
    copy.splice(id, 1);
    props.onChange(copy);
  };

  return (
    <div className="flex flex-col gap-3">
      <>
        {!!props.value.length ? (
          props.value.map((p, idx) => (
            <div
              className="flex flex-row items-center justify-between rounded-lg bg-base-100 p-4 shadow-lg"
              key={p.firstName + p.lastName}
            >
              <div className="font-medium">{p.firstName}</div>
              {props.isEditing ? (
                <ReassignNode
                  patronId={p.id}
                  onSubmit={() => removeFromState(idx)}
                />
              ) : (
                <button
                  onClick={() => removeFromState(idx)}
                  className="btn btn-circle btn-ghost btn-sm"
                >
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
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              )}
            </div>
          ))
        ) : (
          <div role="alert" className="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 stroke-info"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>You haven&apos;t added any swimmers to your pass yet!</span>
          </div>
        )}
      </>
      {showForm ? (
        <PatronForm
          onCancel={() => {
            setShowForm(false);
          }}
          disabled={isGray}
          onSubmit={onSubmit}
          submitText="Add"
        />
      ) : (
        <div className="flex justify-end">
          <button
            className="btn btn-ghost"
            onClick={() => setShowForm((prev) => !prev)}
            disabled={isGray}
          >
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Patron
          </button>
        </div>
      )}
    </div>
  );
};

type SeasonPassFormData = {
  label: string;
};

function SinglePassPage() {
  const params = useParams();
  const id = (id: string | string[] | undefined = params?.id) =>
    id?.toString() ?? "0";
  const isEditing = id() !== "0";

  const { data, isLoading } = api.passes.getById.useQuery(
    { id: id() },
    { enabled: isEditing },
  );
  const isReallyLoading = isLoading && isEditing;

  const [patrons, setPatrons] = useState<
    RouterOutputs["passes"]["createPatron"][]
  >([]);

  const router = useRouter();

  const { register, handleSubmit, reset, formState } =
    useForm<SeasonPassFormData>();
  useEffect(() => {
    if (data && !isReallyLoading) {
      reset({ label: data.label });
      setPatrons(data.patrons);
    }
  }, [isReallyLoading, data, reset]);

  const ctx = api.useUtils();
  const { mutate: editMutate, isLoading: isUpdating } =
    api.passes.updateSeasonPass.useMutation({
      onSuccess: (data) => {
        void ctx.passes.getById.invalidate({
          id: data.id,
        });
        router.push("/passes");
        toast.success("Pass Updated!");
      },
      onError: handleApiError,
    });
  const { mutate: createMutate, isLoading: isCreating } =
    api.passes.createSeasonPass.useMutation({
      onSuccess: () => {
        reset();
        setPatrons([]);
        void ctx.passes.getAll.invalidate();
        router.push("/passes");
        toast.success("Pass Created!");
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
    <PageLayout>
      <dialog id="single-item-modal" className="modal modal-open">
        <form method="dialog" className="modal-backdrop">
          <Link href="/passes">close</Link>
        </form>
        <div className="modal-box">
          <form method="dialog">
            <Link
              href="/passes"
              className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
            >
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
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </Link>
          </form>
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
              />
              <h2 className="font-semibold underline">Pass Details</h2>
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col gap-3"
              >
                <label className="text-xs font-medium">
                  Label / Family Name
                </label>
                <input
                  id="label"
                  placeholder="Ex: Johnson, Anderson, etc..."
                  className="input input-bordered grow"
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
                  <button
                    className="btn btn-primary"
                    disabled={!formState.isValid || !formState.isDirty}
                    type="submit"
                  >
                    {isEditing ? "Update" : "Create"}
                  </button>
                )}
              </form>
            </>
          )}
        </div>
      </dialog>
    </PageLayout>
  );
}

export default isAuth(SinglePassPage, "employee");
