'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from '../legal.module.css';

export default function CookiePolicyPage() {
  return (
    <div className={styles.page}>
      <nav aria-label="Breadcrumb">
        <Link href="/legal" className={styles.backLink}>
          <ArrowLeft className="w-4 h-4" />
          Back to Legal
        </Link>
      </nav>

      <article className={styles.article}>
        <header>
          <h1>Cookie Policy</h1>
          <p className={styles.meta}>Last updated: January 2026</p>
        </header>

        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device. They help websites work properly,
          improve security, and (when enabled) provide analytics.
        </p>

        <h2>2. Cookies we use</h2>

        <div className={`${styles.callout} ${styles.calloutDefinition}`}>
          <div className={styles.calloutTitle}>Definition</div>
          <h3>Essential cookies</h3>
          <p>
            These cookies are required for core functionality such as authentication, session
            management, and security.
          </p>
        </div>

        <div className={`${styles.callout} ${styles.calloutDefinition}`}>
          <div className={styles.calloutTitle}>Definition</div>
          <h3>Consent preferences</h3>
          <p>
            We store your cookie preferences locally in your browser (localStorage) for up to
            3 months, or until you change your choice.
          </p>
        </div>

        <div className={`${styles.callout} ${styles.calloutDefinition}`}>
          <div className={styles.calloutTitle}>Definition</div>
          <h3>Optional cookies</h3>
          <p>
            Optional cookies and similar technologies (e.g. analytics or marketing tags) are only
            enabled after you provide consent. When you change your consent (accept or revoke),
            the page reloads to apply the new settings.
          </p>
        </div>

        <h2>3. Managing preferences</h2>
        <p>
          You can open the cookie consent manager at any time using the “Cookies” button in the
          bottom-left corner of the site.
        </p>
        <p>
          You can also change your browser settings to block or delete cookies. Note that blocking
          essential cookies may prevent you from logging in or using parts of the service.
        </p>

        <h2>4. Related policies</h2>
        <ul>
          <li>
            <Link href="/legal/privacy">Privacy Policy</Link>
          </li>
          <li>
            <Link href="/legal/terms">Terms of Service</Link>
          </li>
        </ul>

        <h2>5. Contact</h2>
        <p>
          For questions about cookies and privacy, contact: <code>privacy@chatbot-studio.com</code>
        </p>
      </article>
    </div>
  );
}
