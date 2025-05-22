import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { Controller, useForm } from "react-hook-form";

import { api } from "~/utils/api";
import { Button } from "~/components/button";
import { useParams } from "next/navigation";
import handleApiError from "~/helpers/handleApiError";
import { InputNumber } from "antd";
import moneyMask from "~/helpers/moneyMask";
import { PageLayout } from "~/components/layout";
import isAuth from "~/components/isAuth";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { router } from "@trpc/server";

type AdmissionFormData = {
  label: string;
  sellingPrice: number;
  passType: "seasonal" | "day";
  patronLimit: number | null;
};

const AdmissionItemForm = (props: {
  onSubmit: (data: AdmissionFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: AdmissionFormData;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const [showPatronLimit, setShowPatronLimit] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState,
    reset,
    getValues,
    control,
  } = useForm<AdmissionFormData>({
    defaultValues: {
      label: "",
      sellingPrice: 0,
      passType: "day",
    },
  });
  const watchPassType = watch("passType");

  useEffect(() => {
    if (getValues().label === "" && data) reset(data);
  }, [data, reset, getValues]);

  useEffect(() => {
    setShowPatronLimit(watchPassType === "seasonal");
  }, [watchPassType, setShowPatronLimit]);

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit((values) => {
        onSubmit(values);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        type="text"
        placeholder="Ex: Adult Day Pass"
        className="input input-bordered grow"
        {...register("label", {
          required: true,
          disabled: isSubmitting || isLoading,
        })}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <Controller
        control={control}
        name="sellingPrice"
        render={({ field }) => (
          <InputNumber
            {...moneyMask}
            placeholder="$0.00"
            disabled={isSubmitting || isLoading}
            min={0}
            value={field.value}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />

      <div className="mb-4 flex items-center">
        <input
          id="passTypeDayPassOption"
          type="radio"
          value="day"
          {...register("passType")}
          className="radio"
        />
        <label
          htmlFor="passTypeDayPassOption"
          className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          Day Pass
        </label>
      </div>
      <div className="flex items-center">
        <input
          id="passTypeSeasonalPassOption"
          type="radio"
          value="seasonal"
          {...register("passType")}
          className="radio"
        />
        <label
          htmlFor="passTypeSeasonalPassOption"
          className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          Seasonal Pass
        </label>
      </div>
      {showPatronLimit && (
        <>
          <label htmlFor="patronLimit" className="text-xs font-medium">
            Patron Limit
          </label>
          <input
            id="patronLimit"
            type="number"
            placeholder="Ex: 4"
            className="input input-bordered grow"
            {...register("patronLimit", {
              required: watchPassType === "seasonal",
              disabled: isSubmitting || isLoading,
              valueAsNumber: true,
              min: 1,
            })}
          />
        </>
      )}
      {!isSubmitting && (
        <Button
          primary
          disabled={isSubmitting || !formState.isValid}
          type="submit"
        >
          {data ? "Save" : "Create"}
        </Button>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </form>
  );
};

type ConcessionFormData = {
  label: string;
  purchasePrice: number;
  sellingPrice: number;
  inStock: number;
};

const ConcessionItemForm = (props: {
  onSubmit: (data: ConcessionFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: ConcessionFormData;
  onDelete?: () => void;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const { register, handleSubmit, watch, formState, reset, control } =
    useForm<ConcessionFormData>({
      defaultValues: {
        label: "",
        purchasePrice: 0,
        sellingPrice: 0,
        inStock: 0,
      },
    });
  const watchForm = watch();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const [areYouSure, setAreYouSure] = useState(false);

  const quantityInput = (
    <input
      id="init-stock"
      type="number"
      placeholder="Ex: 0"
      className="input input-bordered w-full grow"
      {...register("inStock", {
        required: true,
        disabled: isSubmitting || isLoading || !!data,
        valueAsNumber: true,
        min: 1,
      })}
    />
  );

  const quantityRow = !data ? (
    quantityInput
  ) : (
    <div className="flex flex-row gap-2">
      <div className="tooltip w-full" data-tip="Cannot modify stock from here.">
        {quantityInput}
      </div>
      <Link href="/items/restock" className="btn btn-ghost">
        Restock
      </Link>
    </div>
  );

  const handleDelete = () => {
    console.log("delete");
    if (props.onDelete) {
      props.onDelete();
    }
  };

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit(() => {
        onSubmit(watchForm);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        placeholder="Ex: Candy Bar"
        className="input input-bordered grow"
        {...register("label", {
          required: true,
          disabled: isSubmitting || isLoading,
        })}
      />
      <label className="text-xs font-medium">Purchase Price</label>
      <Controller
        control={control}
        name="purchasePrice"
        render={({ field }) => (
          <InputNumber
            {...moneyMask}
            placeholder="$0.00"
            min={0}
            disabled={isSubmitting || isLoading}
            value={field.value}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <Controller
        control={control}
        name="sellingPrice"
        render={({ field }) => (
          <InputNumber
            {...moneyMask}
            placeholder="$0.00"
            disabled={isSubmitting || isLoading}
            min={0}
            value={field.value}
            onChange={(v) => field.onChange(v)}
          />
        )}
      />
      <label className="text-xs font-medium">
        {!data && "Initial "}Quantity in Stock
      </label>
      {quantityRow}
      {!isSubmitting && (
        <div className="flex gap-1">
          <button
            className="btn btn-primary w-4/5"
            disabled={isSubmitting || !formState.isValid}
            type="submit"
          >
            {data ? "Save" : "Create"}
          </button>
          {!!data && (
            <button
              onClick={() => setAreYouSure(true)}
              type="button"
              className="btn btn-outline btn-error w-1/5"
            >
              Delete
            </button>
          )}
        </div>
      )}
      {areYouSure && (
        <dialog id="delete_modal" className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Are you sure?</h3>
            <p className="py-4">This action cannot be undone.</p>
            <div className="modal-action">
              <button
                onClick={handleDelete}
                type="button"
                className="btn btn-error"
              >
                Yes
              </button>
              <button onClick={() => setAreYouSure(false)} className="btn">
                No
              </button>
            </div>
          </div>
        </dialog>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      )}
    </form>
  );
};

const CreateItemWizard = () => {
  // ctx v. api: ctx = server side OR as part of the request... or is it just the react context?
  const ctx = api.useUtils();
  const router = useRouter();
  const { mutate: concessionMutation, isLoading: isCreating } =
    api.items.createConcessionItem.useMutation({
      onSuccess: async () => {
        void ctx.items.getById.invalidate();
        await router.push("/items");
        toast.success("Item Created!");
      },
      onError: handleApiError,
    });
  const { mutate: admissionMutation, isLoading: isCreatingA } =
    api.items.createAdmissionItem.useMutation({
      onSuccess: async () => {
        void ctx.items.getById.invalidate();
        await router.push("/items");
        toast.success("Item Created!");
      },
      onError: handleApiError,
    });

  const [tab, setTab] = useState<"admission" | "concession">("admission");

  return (
    <div className="flex w-full flex-col gap-3">
      <div role="tablist" className="tabs-boxed tabs">
        <a
          role="tab"
          className={`tab ${tab === "concession" && "tab-active"}`}
          onClick={() => setTab("concession")}
        >
          Concession
        </a>
        <a
          role="tab"
          className={`tab ${tab === "admission" && "tab-active"}`}
          onClick={() => setTab("admission")}
        >
          Admission
        </a>
      </div>
      {tab === "admission" ? (
        <AdmissionItemForm
          isLoading={false}
          isSubmitting={isCreatingA}
          onSubmit={(data) =>
            admissionMutation({
              ...data,
              isDay: data.passType === "day",
              isSeasonal: data.passType === "seasonal",
              patronLimit:
                data.passType === "seasonal"
                  ? data.patronLimit ?? 1
                  : undefined,
            })
          }
        />
      ) : (
        <ConcessionItemForm
          isLoading={false}
          isSubmitting={isCreating}
          onSubmit={concessionMutation}
        />
      )}
    </div>
  );
};

const EditItemWizard = (props: { id: string }) => {
  const { data, isLoading } = api.items.getById.useQuery({ id: props.id });

  const ctx = api.useUtils();
  const router = useRouter();
  const { mutate: concessionMutate, isLoading: isUpdating } =
    api.items.updateConcessionItem.useMutation({
      onSuccess: async () => {
        toast.success("Updates saved!");
        await router.push("/items");
        void ctx.items.getById.invalidate();
      },
      onError: handleApiError,
    });
  const { mutate: admissionMutate, isLoading: isUpdatingA } =
    api.items.updateAdmissionItem.useMutation({
      onSuccess: async () => {
        toast.success("Updates saved!");
        await router.push("/items");
        void ctx.items.getById.invalidate();
      },
      onError: handleApiError,
    });
  const { mutate: deleteItem, isLoading: isDeleting } =
    api.items.deleteConcessionItem.useMutation({
      onSuccess: async () => {
        void ctx.items.getById.invalidate();
        await router.push("/items");
        toast.success("Item Deleted!");
      },
      onError: handleApiError,
    });

  if (isLoading) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3">
      {data?.item.isConcessionItem ? (
        <ConcessionItemForm
          data={data?.item as ConcessionFormData}
          isLoading={isLoading}
          isSubmitting={isUpdating || isDeleting}
          onSubmit={(data) => concessionMutate({ ...data, id: props.id })}
          onDelete={() => deleteItem({ id: data?.item.id })}
        />
      ) : (
        <AdmissionItemForm
          data={{
            label: "",
            sellingPrice: 0,
            patronLimit: null,
            ...data?.item,
            passType: data?.item.isSeasonal ? "seasonal" : "day",
          }}
          isLoading={isLoading}
          isSubmitting={isUpdatingA}
          onSubmit={(data) =>
            admissionMutate({
              ...data,
              id: props.id,
              isDay: data.passType === "day",
              isSeasonal: data.passType === "seasonal",
              patronLimit:
                data.passType === "seasonal"
                  ? data.patronLimit ?? 1
                  : undefined,
            })
          }
        />
      )}
    </div>
  );
};

function SingleItemPage() {
  const params = useParams();
  const id = params?.id ?? "0";

  return (
    <>
      <Head>
        <title>Guard Shack - Item</title>
      </Head>
      <PageLayout>
        <dialog id="single-item-modal" className="modal modal-open">
          <form method="dialog" className="modal-backdrop">
            <Link href="/items">close</Link>
          </form>
          <div className="modal-box">
            <form method="dialog">
              <Link
                href="/items"
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
            <div className="mt-4">
              {id === "0" ? (
                <CreateItemWizard />
              ) : (
                <EditItemWizard id={id as string} />
              )}
            </div>
          </div>
        </dialog>
      </PageLayout>
    </>
  );
}

export default isAuth(SingleItemPage, "admin");
