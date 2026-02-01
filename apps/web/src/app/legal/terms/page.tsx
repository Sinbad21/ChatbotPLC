'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '../legal.module.css';

export default function TermsPage() {
  return (
    <div className={styles.page}>
      <nav aria-label="Breadcrumb">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      <article className={styles.article}>
        <header>
          <h1>Terms of Service</h1>
          <p className={styles.meta}>Last updated: November 2025</p>
        </header>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using OMNICAL STUDIO ("Service"), you agree to be bound by these Terms of
          Service ("Terms"). If you do not agree to these Terms, do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          OMNICAL STUDIO provides AI-powered chatbot creation and deployment tools. The Service
          allows you to create, train, and deploy chatbots on your website and other platforms.
        </p>

        <div className={`${styles.callout} ${styles.calloutObligations}`}>
          <div className={styles.calloutTitle}>Your Obligations</div>

          <h2>3. Account Registration</h2>
          <p>To use the Service, you must:</p>
          <ul>
            <li>Be at least 18 years old</li>
            <li>Provide accurate and complete registration information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Promptly update your account information</li>
          </ul>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit harmful, offensive, or illegal content</li>
            <li>Impersonate others or provide false information</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Attempt to gain unauthorized access to the Service</li>
          </ul>
        </div>

        <h2>5. Subscription and Payments</h2>
        <h3>Billing</h3>
        <p>
          Paid subscriptions are billed in advance on a monthly or annual basis. All fees are in
          USD and non-refundable except as required by law or as explicitly stated in our refund
          policy.
        </p>

        <h3>Free Trial</h3>
        <p>
          We may offer a free trial period. You will not be charged during the trial unless you
          explicitly choose to subscribe. Trials automatically convert to paid subscriptions unless
          cancelled.
        </p>

        <h3>Cancellation</h3>
        <p>
          You may cancel your subscription at any time from your account settings. You will
          continue to have access until the end of your billing period.
        </p>

        <h2>6. Intellectual Property</h2>
        <h3>Our IP</h3>
        <p>
          The Service, including all software, algorithms, and content, is owned by OMNICAL STUDIO
          and protected by copyright and other intellectual property laws.
        </p>

        <h3>Your Content</h3>
        <p>
          You retain ownership of all content you upload to the Service. By uploading content, you
          grant us a license to use it to provide the Service.
        </p>

        <h2>7. Data and Privacy</h2>
        <p>
          Your use of the Service is subject to our Privacy Policy. We process your data in
          accordance with GDPR and other applicable privacy laws.
        </p>

        <h2>8. Service Availability</h2>
        <p>
          We strive to maintain 99.9% uptime but do not guarantee uninterrupted access to the
          Service. We reserve the right to suspend or discontinue the Service with reasonable
          notice.
        </p>

        <div className={`${styles.callout} ${styles.calloutWarning}`}>
          <div className={styles.calloutTitle}>Important Disclaimers</div>

          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OMNICAL STUDIO SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS
            OR REVENUES.
          </p>

          <h2>10. Warranty Disclaimer</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A
            PARTICULAR PURPOSE.
          </p>
        </div>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless OMNICAL STUDIO from any claims, damages, or
          expenses arising from your use of the Service or violation of these Terms.
        </p>

        <h2>12. Termination</h2>
        <p>
          We may terminate or suspend your account immediately if you violate these Terms. Upon
          termination, your right to use the Service will cease immediately.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict
          of law principles.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. We will notify you of material
          changes by email or through the Service. Continued use constitutes acceptance of the
          modified Terms.
        </p>

        <h2>15. Contact</h2>
        <p>For questions about these Terms, contact us at legal@chatbot-studio.com</p>
      </article>
    </div>
  );
}
