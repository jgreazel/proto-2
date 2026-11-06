import { SignedIn, SignedOut, SignIn } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect } from "react";

function RedirectToApp() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/app");
  }, [router]);

  return null;
}

export default function SignInPage() {
  return (
    <>
      <SignedIn>
        <RedirectToApp />
      </SignedIn>
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center">
          <SignIn redirectUrl="/app" />
        </div>
      </SignedOut>
    </>
  );
}
