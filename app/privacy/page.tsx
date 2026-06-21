import LegalLayout from "@/components/LegalLayout"

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="June 19, 2026">
      <p>
        PawNest (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This Privacy Policy explains what
        information we collect, how we use it, and your rights regarding that information when
        you visit or make a purchase on pawnest-store-s9fk.vercel.app (the &quot;Site&quot;).
      </p>

      <h2>1. Information We Collect</h2>
      <p>When you place an order, we collect:</p>
      <ul>
        <li>Name, email address, and phone number</li>
        <li>Shipping address (country, province, city, street address, ZIP code)</li>
        <li>Order details (items purchased, quantities, prices)</li>
      </ul>
      <p>
        Payment card details are never stored on our servers — all payments are processed
        securely by <a href="https://www.paypal.com/us/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer">PayPal</a>,
        a PCI-DSS compliant payment processor.
      </p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To process and fulfill your order, including sharing your shipping details with our fulfillment partner, CJ Dropshipping, for the sole purpose of delivering your package</li>
        <li>To send order confirmations and shipment tracking notifications by email</li>
        <li>To respond to customer support inquiries</li>
        <li>To improve our products and Site experience</li>
      </ul>

      <h2>3. Third-Party Services</h2>
      <p>We share limited data with the following third parties strictly to operate our store:</p>
      <ul>
        <li><strong>PayPal</strong> — payment processing</li>
        <li><strong>CJ Dropshipping</strong> — order fulfillment and shipping</li>
        <li><strong>Email service provider</strong> — transactional order emails</li>
      </ul>
      <p>We do not sell or rent your personal information to third parties for marketing purposes.</p>

      <h2>4. Cookies</h2>
      <p>
        We use essential cookies and browser local storage to remember the contents of your
        shopping cart between page visits. We do not currently use third-party advertising or
        tracking cookies.
      </p>

      <h2>5. Data Retention</h2>
      <p>
        We retain order information for as long as necessary to fulfill legal, accounting, and
        customer support obligations.
      </p>

      <h2>6. Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data at any time
        by contacting us at <a href="mailto:support@pawnest.com">support@pawnest.com</a>.
      </p>

      <h2>7. Contact Us</h2>
      <p>
        Questions about this Privacy Policy can be sent to{" "}
        <a href="mailto:support@pawnest.com">support@pawnest.com</a>.
      </p>
    </LegalLayout>
  )
}
