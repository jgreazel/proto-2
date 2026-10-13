import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

const contactEmail = "jon@guardshack.work";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Guard Shack | A clear record of pool operations</title>
        <meta
          name="description"
          content="Guard Shack gives community pools a clear operational audit trail. Live at the Audubon, Iowa community pool."
        />
      </Head>
      <main className="min-h-screen bg-stone-50 text-slate-900">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Guard Shack home"
          >
            <Image
              src="/LOGO.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="text-lg font-bold tracking-tight">
              Guard Shack
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
          >
            Staff sign in
          </Link>
        </header>

        <section className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Live at the Audubon, Iowa community pool
            </p>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              A clear operational audit trail for your community pool.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Know what happened on each shift and at closing—without chasing
              paper records or piecing together the day after the fact.
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="min-h-12 mt-8 inline-flex items-center justify-center rounded-lg bg-emerald-800 px-6 py-3 font-semibold text-white transition hover:bg-emerald-900"
            >
              Email Jon
            </a>
          </div>

          <div className="mt-14 grid gap-10 border-t border-slate-200 pt-8 sm:mt-20 sm:grid-cols-[1.2fr_0.8fr] sm:gap-16 sm:pt-10">
            <section aria-labelledby="pain-points">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
                Built around real pool-side work
              </p>
              <h2
                id="pain-points"
                className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                The end-of-day details shouldn&apos;t get lost.
              </h2>
              <ul className="mt-6 space-y-3">
                {[
                  "Paper lifeguard logs",
                  "Missing concession counts",
                  "Cash drawer discrepancies at closing",
                ].map((pain) => (
                  <li
                    key={pain}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-base font-medium shadow-sm sm:text-lg"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-900"
                    >
                      ✓
                    </span>
                    {pain}
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-xl leading-7 text-slate-600">
                Guard Shack helps bring shift activity and pool transactions
                into one reliable record for the people responsible for the
                season—and the city office that closes the books.
              </p>
            </section>

            <aside className="h-fit rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-widest text-emerald-300">
                Built in Iowa
              </p>
              <h2 className="mt-3 text-2xl font-bold">A real person nearby.</h2>
              <p className="mt-4 leading-7 text-slate-300">
                I&apos;m Jon Greazel, an independent software developer in
                Altoona, Iowa. Guard Shack is running at the Audubon community
                pool.
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="mt-6 inline-block break-all font-semibold text-emerald-300 underline decoration-emerald-500 underline-offset-4 hover:text-white"
              >
                {contactEmail}
              </a>
            </aside>
          </div>
        </section>

        <footer className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>Guard Shack · Built in Altoona, Iowa</span>
            <a
              href={`mailto:${contactEmail}`}
              className="font-medium hover:text-slate-900"
            >
              {contactEmail}
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
