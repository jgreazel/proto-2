import { PageLayout } from "~/components/layout";
import Link from "next/link";
import Relax from "~/components/relax";

export default function HomePage() {
  return (
    <PageLayout>
      <div className="flex flex-row justify-evenly p-4">
        <div className="w-400 flex justify-end">
          <Relax />
        </div>
        <div>
          <h1 className="p-3 text-lg font-medium">I need to...</h1>
          <div className="flex flex-col">
            <Link className="btn btn-ghost btn-wide" href="checkout">
              Sell Concessions and Passes
            </Link>
            <Link className="btn btn-ghost btn-wide" href="items/restock">
              Receive a Shipment
            </Link>
            <Link className="btn btn-ghost btn-wide" href="passes/0">
              Create a New Season Pass
            </Link>
            <Link className="btn btn-ghost btn-wide" href="reports">
              Analyze Data
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
