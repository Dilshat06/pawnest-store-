import LegalLayout from "@/components/LegalLayout"

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy" updated="June 19, 2026">
      <p>
        We want you and your pet to be happy with every order. This policy explains how returns,
        exchanges, and refunds work at PawNest.
      </p>

      <h2>1. Damaged or Incorrect Items</h2>
      <p>
        If your order arrives damaged, defective, or different from what you ordered, contact us
        within 7 days of delivery at <a href="mailto:support@pawnest.com">support@pawnest.com</a>{" "}
        with your order number and photos of the issue. We will offer a replacement or a full
        refund at no additional cost.
      </p>

      <h2>2. Change of Mind Returns</h2>
      <p>
        If you simply changed your mind, you may request a return within 14 days of delivery,
        provided the item is unused and in its original packaging. Return shipping costs are the
        customer's responsibility unless the item was defective.
      </p>

      <h2>3. Non-Returnable Items</h2>
      <ul>
        <li>Used or opened consumable items (treats, food, grooming products) for hygiene reasons</li>
        <li>Items marked as final sale at the time of purchase</li>
      </ul>

      <h2>4. Refund Processing</h2>
      <p>
        Once your return is received and inspected, we will notify you of the approval status of
        your refund. Approved refunds are issued to your original payment method via Stripe
        within 5–10 business days.
      </p>

      <h2>5. Order Cancellations</h2>
      <p>
        Orders can be cancelled free of charge before they are marked as shipped. Once an order
        has been dispatched to our fulfillment partner for shipping, it can no longer be
        cancelled, but you may request a return upon delivery.
      </p>

      <h2>6. Contact Us</h2>
      <p>
        For any questions about returns or refunds, reach out to{" "}
        <a href="mailto:support@pawnest.com">support@pawnest.com</a>.
      </p>
    </LegalLayout>
  )
}
