import Head from "next/head";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import SuperJSON from "superjson";
import { type GetStaticProps } from "next";
import { PageLayout } from "~/components/layout";
import Image from "next/image";

// find a better (more next) way to infer ssg props
export default function ProfilePage({ username }: { username: string }) {
  const { data } = api.profile.getUserByUsername.useQuery({
    username: "test",
  });

  if (!data) return <div> 404 </div>;
  return (
    <>
      <Head>
        <title>{username}</title>
      </Head>
      <PageLayout>
        <div className="flex items-center gap-2">
          <Image
            src={data.imageUrl}
            alt="Profile Pic"
            width="48"
            height="48"
            className="rounded-full"
          />
          <div className="font-semibold capitalize">{data.username}</div>
        </div>
      </PageLayout>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: SuperJSON,
  });

  const slug = context.params?.slug;
  if (typeof slug !== "string") {
    throw new Error("No slug");
  }
  const username = slug.replace("@", "");
  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
