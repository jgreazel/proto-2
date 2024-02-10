import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";

export default function ItemsPage() {
  return (
    <PageLayout>
      <h1 className="p-3 font-bold underline">Home</h1>
      <div className="flex flex-row gap-3">
        <Button href="items">Items</Button>
        <Button href="passes">Passes</Button>
        <Button href="checkout">Checkout</Button>
        <Button href="reports">Reports</Button>
      </div>
    </PageLayout>
  );
}
