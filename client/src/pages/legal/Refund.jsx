import LegalLayout from './LegalLayout';
import { LEGAL } from '../../config/legal';

const Refund = () => (
  <LegalLayout
    title="Refund &amp; Cancellation Policy"
    slug="refund"
    description={`Cancellation and refund terms for ${LEGAL.productName} subscriptions.`}
  >
    <p>
      This policy explains how cancellations and refunds work for paid {LEGAL.productName}
      {' '}subscriptions. It forms part of our <a href="/terms">Terms of Service</a>.
    </p>

    <h2>1. Subscriptions</h2>
    <p>
      Pro and Premium plans are billed in advance on a recurring monthly basis through Stripe. Your
      plan renews automatically until you cancel.
    </p>

    <h2>2. Cancelling</h2>
    <p>
      You can cancel at any time from the billing portal in the app (Dashboard → Manage
      subscription). When you cancel:
    </p>
    <ul>
      <li>Your plan stays active until the end of the current billing period.</li>
      <li>You will not be charged again after the current period ends.</li>
      <li>Your account then returns to the Free plan; your resumes and data remain available.</li>
    </ul>

    <h2>3. Refunds</h2>
    <p>
      {/* EDIT THIS to match your business decision. The default below is "cancel
          anytime, no prorated refunds for the current period." */}
      Payments are generally non-refundable, and we do not provide prorated refunds for the unused
      portion of a billing period. You keep access to your paid features until the end of the period
      you already paid for.
    </p>
    <p>
      If you were charged in error, experienced a billing problem, or believe you are entitled to a
      refund under applicable consumer-protection law, contact us at{' '}
      <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> within 14 days of the charge
      and we will review your request in good faith.
    </p>

    <h2>4. Free plan</h2>
    <p>
      The Free plan is available at no cost and includes a limited monthly allowance of AI credits.
      No payment or refund applies to the Free plan.
    </p>

    <h2>5. Changes</h2>
    <p>
      We may update this policy from time to time. The &ldquo;Last updated&rdquo; date above
      reflects the current version.
    </p>

    <h2>6. Contact</h2>
    <p>
      Questions about a charge or cancellation? Email{' '}
      <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>.
    </p>
  </LegalLayout>
);

export default Refund;
