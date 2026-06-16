import LegalLayout from './LegalLayout';
import { LEGAL } from '../../config/legal';

const Terms = () => (
  <LegalLayout
    title="Terms of Service"
    slug="terms"
    description={`The terms that govern your use of ${LEGAL.productName}.`}
  >
    <p>
      These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the
      {' '}{LEGAL.productName} website and services (the &ldquo;Service&rdquo;) provided by
      {' '}{LEGAL.companyName} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating an account or using
      the Service, you agree to these Terms and to our{' '}
      <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.
    </p>

    <h2>1. Eligibility &amp; accounts</h2>
    <p>
      You must be at least 16 years old to use the Service. You are responsible for the activity
      under your account and for keeping your credentials secure. Provide accurate information and
      keep it up to date.
    </p>

    <h2>2. Acceptable use</h2>
    <p>You agree not to:</p>
    <ul>
      <li>Use the Service for unlawful, fraudulent, or harmful purposes.</li>
      <li>Submit content that infringes others&rsquo; rights or that you have no right to use.</li>
      <li>Attempt to disrupt, reverse-engineer, scrape, or gain unauthorized access to the Service.</li>
      <li>Abuse, overload, or circumvent usage limits, credits, or paywalls.</li>
    </ul>

    <h2>3. Your content</h2>
    <p>
      You retain ownership of the resume and profile content you create or upload (&ldquo;Your
      Content&rdquo;). You grant us a limited license to store and process Your Content solely to
      operate and provide the Service to you, including sending it to our AI provider to generate
      outputs you request. You are responsible for the accuracy and legality of Your Content.
    </p>

    <h2>4. AI-generated content</h2>
    <p>
      The Service uses AI to generate suggestions, resumes, cover letters, scores, and similar
      outputs. These are provided for your assistance only and may be inaccurate or incomplete. You
      are responsible for reviewing and verifying all output before relying on or submitting it.
      We do not guarantee any particular result, including interviews, employment, or ATS
      performance. Do not use the Service to fabricate qualifications.
    </p>

    <h2>5. Subscriptions &amp; billing</h2>
    <ul>
      <li>
        Paid plans (Pro and Premium) are billed in advance on a recurring basis through our payment
        processor, Stripe, until cancelled.
      </li>
      <li>
        Your subscription renews automatically at the end of each billing period unless you cancel
        before the renewal date.
      </li>
      <li>
        You can cancel or manage your subscription at any time from the billing portal in the app.
        See our <a href="/refund">Refund Policy</a> for details on cancellations and refunds.
      </li>
      <li>We may change plan features or pricing prospectively, with notice where required.</li>
    </ul>

    <h2>6. Intellectual property</h2>
    <p>
      The Service, including its software, design, and branding, is owned by {LEGAL.companyName} and
      protected by applicable laws. Except for Your Content, you may not copy, modify, or
      redistribute any part of the Service without our permission.
    </p>

    <h2>7. Termination</h2>
    <p>
      You may stop using the Service and delete your account at any time. We may suspend or
      terminate your access if you violate these Terms or use the Service in a way that risks harm
      to others or to us. Upon termination, your right to use the Service ends.
    </p>

    <h2>8. Disclaimers</h2>
    <p>
      The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties
      of any kind, whether express or implied, including fitness for a particular purpose and
      non-infringement, to the maximum extent permitted by law.
    </p>

    <h2>9. Limitation of liability</h2>
    <p>
      To the maximum extent permitted by law, {LEGAL.companyName} will not be liable for any
      indirect, incidental, special, consequential, or punitive damages, or for lost profits, data,
      or goodwill. Our total liability for any claim relating to the Service will not exceed the
      amount you paid us in the twelve months before the claim.
    </p>

    <h2>10. Indemnification</h2>
    <p>
      You agree to indemnify and hold {LEGAL.companyName} harmless from claims arising out of Your
      Content or your misuse of the Service or violation of these Terms.
    </p>

    <h2>11. Governing law</h2>
    <p>
      These Terms are governed by the laws of {LEGAL.governingLaw}, without regard to conflict-of-law
      rules. Disputes will be subject to the courts located there, unless otherwise required by
      applicable law.
    </p>

    <h2>12. Changes</h2>
    <p>
      We may update these Terms from time to time. We will revise the &ldquo;Last updated&rdquo;
      date and, where appropriate, notify you. Continued use after changes means you accept the
      updated Terms.
    </p>

    <h2>13. Contact</h2>
    <p>
      {LEGAL.companyName}<br />
      {LEGAL.contactAddress && <>{LEGAL.contactAddress}<br /></>}
      <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
    </p>
  </LegalLayout>
);

export default Terms;
