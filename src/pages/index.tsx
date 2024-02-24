import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";

export default function HomePage() {
  return (
    <PageLayout>
      <h1 className="p-3 font-bold underline">Home</h1>
      <div className="flex flex-row gap-3">
        <Button href="checkout">Checkout</Button>
        <Button href="items">Items</Button>
        <Button href="passes">Passes</Button>
        <Button href="reports">Reports</Button>
      </div>
    </PageLayout>
  );
}
