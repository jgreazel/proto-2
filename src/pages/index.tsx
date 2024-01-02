import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";

export default function ItemsPage() {
  return (
    <PageLayout>
      <h1 className="p-3 font-bold underline">Home</h1>
      <Button href="items">Items</Button>
      <Button href="passes">Passes</Button>
      <Button href="checkout">Checkout</Button>
    </PageLayout>
  );
}
