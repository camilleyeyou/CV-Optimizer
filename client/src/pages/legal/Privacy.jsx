import LegalLayout from './LegalLayout';
import { LEGAL } from '../../config/legal';

const Privacy = () => (
  <LegalLayout
    title="Privacy Policy"
    slug="privacy"
    description={`How ${LEGAL.productName} collects, uses, and protects your personal data.`}
  >
    <p>
      This Privacy Policy explains how {LEGAL.companyName} (&ldquo;{LEGAL.productName}&rdquo;,
      &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects your information when you
      use our website and services (the &ldquo;Service&rdquo;). By using the Service, you agree to
      this policy.
    </p>

    <h2>1. Information we collect</h2>
    <ul>
      <li>
        <strong>Account information.</strong> When you register we collect your name and email
        address. Authentication is handled by our infrastructure provider (Supabase).
      </li>
      <li>
        <strong>Resume and profile content.</strong> The information you enter or upload to build
        your resume — including your contact details, work history, education, skills, and any
        documents you import. This may include personal data about you.
      </li>
      <li>
        <strong>Usage data.</strong> Job descriptions and prompts you submit to our AI tools,
        application-tracking entries, and ATS scores you generate.
      </li>
      <li>
        <strong>Payment information.</strong> If you subscribe to a paid plan, payments are
        processed by Stripe. We do <strong>not</strong> receive or store your full card details —
        we store only a customer/subscription reference and your plan status.
      </li>
      <li>
        <strong>Local storage.</strong> We store your login session and small preference flags
        (such as whether you&rsquo;ve seen the onboarding tour) in your browser. We do not use
        third-party advertising or analytics trackers.
      </li>
    </ul>

    <h2>2. How we use your information</h2>
    <ul>
      <li>To provide, operate, and maintain the Service and your account.</li>
      <li>To generate resumes, cover letters, scores, and other AI-assisted outputs you request.</li>
      <li>To process payments and manage subscriptions.</li>
      <li>To respond to support requests and communicate service-related notices.</li>
      <li>To detect, prevent, and address abuse, fraud, or security issues.</li>
    </ul>

    <h2>3. Service providers we share data with</h2>
    <p>We share data only with the providers needed to run the Service:</p>
    <ul>
      <li><strong>Supabase</strong> — database, authentication, and hosting of your account data.</li>
      <li><strong>Stripe</strong> — payment processing and subscription management.</li>
      <li><strong>OpenAI</strong> — processing of the text you submit to AI features to generate outputs.</li>
      <li><strong>Vercel</strong> — application hosting and delivery.</li>
    </ul>
    <p>
      We do not sell your personal data. We may disclose information if required by law or to
      protect our rights, users, or the public.
    </p>

    <h2>4. AI processing</h2>
    <p>
      When you use an AI feature, the relevant content (for example your resume text and a job
      description) is sent to our AI provider to generate a response. Do not submit information you
      are not comfortable processing in this way.
    </p>

    <h2>5. Data retention</h2>
    <p>
      We retain your account and content for as long as your account is active. When you delete
      your account, we delete your resumes, applications, scores, share links, and profile, and we
      remove your authentication record. Backups and provider logs may persist for a limited period.
    </p>

    <h2>6. Your rights</h2>
    <p>
      Depending on your location (including under the GDPR and CCPA), you may have the right to
      access, correct, export, or delete your personal data, and to object to or restrict certain
      processing. You can:
    </p>
    <ul>
      <li><strong>Export your data</strong> at any time from your <em>Account &amp; Data</em> page.</li>
      <li><strong>Delete your account and data</strong> from the same page.</li>
      <li>Contact us at <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> to exercise any other right.</li>
    </ul>

    <h2>7. Security</h2>
    <p>
      We use reputable infrastructure providers and access controls to protect your data. No method
      of transmission or storage is completely secure, so we cannot guarantee absolute security.
    </p>

    <h2>8. International transfers</h2>
    <p>
      Our providers may process and store data in countries other than yours. Where required, we
      rely on appropriate safeguards for such transfers.
    </p>

    <h2>9. Children</h2>
    <p>
      The Service is not directed to children under 16, and we do not knowingly collect their
      personal data. If you believe a child has provided us data, contact us and we will delete it.
    </p>

    <h2>10. Changes to this policy</h2>
    <p>
      We may update this policy from time to time. We will revise the &ldquo;Last updated&rdquo;
      date above and, where appropriate, notify you of material changes.
    </p>

    <h2>11. Contact</h2>
    <p>
      {LEGAL.companyName}<br />
      {LEGAL.contactAddress}<br />
      <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a>
    </p>
  </LegalLayout>
);

export default Privacy;
