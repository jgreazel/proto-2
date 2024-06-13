import { type Dayjs } from "dayjs";
import { useForm } from "react-hook-form";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { RouterOutputs, api } from "~/utils/api";

type GetEventsData = {
  date: Dayjs;
  userId: string;
};

type GetEventFormProps = {
  onSubmit: (data: GetEventsData) => void;
};

const GetEventsForm = (props: GetEventFormProps) => {
  const { register, handleSubmit } = useForm<GetEventsData>();

  return <form onSubmit={handleSubmit(props.onSubmit)}></form>;
};

type TableProps = {
  data: GetEventsData;
};

const EventsTable = (props: TableProps) => {
  const { data, isLoading, error } =
    api.timeclockAdmin.getTimeclockEvents.useQuery({
      userId: props.data.userId,
      range: [
        props.data.date.startOf("day").toDate(),
        props.data.date.endOf("day").toDate(),
      ],
    });

  if (isLoading) return <LoadingPage />;
  if (error)
    return <div className="badge badge-error">Error: {error.message}</div>;

  return <>hi</>;
};

const TimeclockAdminView = () => {
  // todo state var for form data, conditionally render table which queries. use editable row table, likely each row it's own form?
  return (
    <PageLayout>
      <div>time clock admin view</div>
    </PageLayout>
  );
};

export default isAuth(TimeclockAdminView, "admin");
