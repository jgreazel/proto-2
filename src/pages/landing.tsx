import Link from "next/link";
import { PageLayout } from "~/components/layout";

export default function LandingPage() {
  return (
    <PageLayout>
      <div className="flex min-h-screen flex-col items-center justify-center py-12">
        <img src="/LOGO.png" alt="Logo" className="mb-6 h-24 w-24" />
        <h1 className="mb-4 text-4xl font-bold">Welcome to Guard Shack</h1>
        <p className="mb-8 max-w-xl text-center text-lg">
          Bookkeeping software for lifeguards. Manage passes, concessions, and
          more.
        </p>
        <Link
          href="/sign-in"
          className="btn btn-primary rounded px-8 py-3 text-lg shadow"
        >
          Sign In
        </Link>

        {/* Contact Section */}
        <div className="mt-12 w-full max-w-md rounded bg-base-200 p-6 text-center shadow">
          <h2 className="mb-2 text-xl font-semibold">Contact</h2>
          <p className="mb-2 text-base">
            Interested in Guard Shack or have questions?
          </p>
          <a
            href="mailto:jdgreazel@gmail.com"
            className="hover:text-primary-focus font-medium text-primary underline"
          >
            jdgreazel@gmail.com
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
