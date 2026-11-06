import { SignIn } from "@clerk/nextjs";
import { PageLayout } from "~/components/layout";

export default function SignInPage() {
  return (
    <PageLayout>
      <div className="flex min-h-screen items-center justify-center">
        <SignIn afterSignInUrl="/app" />
      </div>
    </PageLayout>
  );
}
