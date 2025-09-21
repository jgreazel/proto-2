import { SignIn } from "@clerk/nextjs";
import { PageLayout } from "~/components/layout";

export default function SignInPage() {
  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center">
        {/* "/sign-in" isn't a public route, so Clerk will redirect to itself to login, then redirect to "/" */}
        <SignIn afterSignInUrl="/" />
      </div>
    </PageLayout>
  );
}
