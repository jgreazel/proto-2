import Head from "next/head";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import SuperJSON from "superjson";
import { type GetStaticProps } from "next";

// find a better (more next) way to infer ssg props
export default function ProfilePage({ username }: { username: string }) {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
    username: "test",
  });

  if (!data) return <div> 404 </div>;
  return (
    <>
      <Head>
        <title>{username}</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">slug fest</div>
        </div>
      </main>
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
