import LegalLayout from "@/components/LegalLayout"

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="June 19, 2026">
      <p>
        Welcome to PawNest. By accessing or using this website (the "Site") and placing an
        order, you agree to be bound by the following Terms of Service.
      </p>

      <h2>1. About Us</h2>
      <p>
        PawNest sells pet care products online. Some products are shipped directly from our
        fulfillment partner, CJ Dropshipping, and may originate internationally. Estimated
        delivery times and shipping details are provided at checkout and may vary by destination.
      </p>

      <h2>2. Orders and Payment</h2>
      <p>
        All payments are processed securely through Stripe. By placing an order, you confirm
        that the payment information provided is accurate and that you are authorized to use the
        payment method. We reserve the right to refuse or cancel any order at our discretion,
        including in cases of suspected fraud or pricing errors.
      </p>

      <h2>3. Shipping</h2>
      <p>
        Shipping times vary depending on the product and destination country, typically ranging
        from 7 to 20 business days. Tracking information will be emailed to you once your order
        ships. PawNest is not responsible for delays caused by customs, carriers, or events
        outside our control.
      </p>

      <h2>4. Returns and Refunds</h2>
      <p>
        Please see our <a href="/refund-policy">Refund Policy</a> for details on returns,
        exchanges, and refunds.
      </p>

      <h2>5. Product Information</h2>
      <p>
        We make reasonable efforts to display product details, images, and pricing accurately.
        Minor variations in color or packaging may occur due to manufacturing differences.
      </p>

      <h2>6. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, PawNest shall not be liable for any indirect,
        incidental, or consequential damages arising from the use of our products or Site.
      </p>

      <h2>7. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. Continued use of the Site after changes
        constitutes acceptance of the updated Terms.
      </p>

      <h2>8. Contact Us</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:support@pawnest.com">support@pawnest.com</a>.
      </p>
    </LegalLayout>
  )
}
