'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Download, Trash2, FileText } from 'lucide-react';
import styles from '../legal.module.css';

export default function GDPRPage() {
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
          <h1>GDPR Compliance</h1>
          <p className={styles.meta}>Last updated: November 2025</p>
        </header>

        <div className={`${styles.callout} ${styles.calloutDefinition}`}>
          <div className={styles.calloutTitle}>Definition</div>
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-platinum-200 flex-shrink-0 mt-1" />
            <div>
              <h2>Our Commitment to GDPR</h2>
              <p>
                OMNICAL STUDIO is fully compliant with the General Data Protection Regulation
                (GDPR) and takes your privacy rights seriously. We have implemented technical and
                organizational measures to ensure the protection of your personal data.
              </p>
            </div>
          </div>
        </div>

        <div className={`${styles.callout} ${styles.calloutRights}`}>
          <div className={styles.calloutTitle}>Your Rights</div>

          <h2>1. Your Rights Under GDPR</h2>
          <p>
            If you are located in the European Economic Area (EEA), you have the following rights
            regarding your personal data:
          </p>

          <div className="space-y-4">
            <section className={`${styles.callout} ${styles.calloutDefinition}`}>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-platinum-200 flex-shrink-0 mt-1" />
                <div>
                  <h3>Right to Access</h3>
                  <p>
                    You have the right to request copies of your personal data. You can access most
                    of your data directly from your account dashboard.
                  </p>
                </div>
              </div>
            </section>

            <section className={`${styles.callout} ${styles.calloutDefinition}`}>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-platinum-200 flex-shrink-0 mt-1" />
                <div>
                  <h3>Right to Rectification</h3>
                  <p>
                    You have the right to request that we correct any information you believe is
                    inaccurate or incomplete.
                  </p>
                </div>
              </div>
            </section>

            <section className={`${styles.callout} ${styles.calloutDefinition}`}>
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-platinum-200 flex-shrink-0 mt-1" />
                <div>
                  <h3>Right to Erasure</h3>
                  <p>
                    You have the right to request that we erase your personal data under certain
                    conditions ("right to be forgotten").
                  </p>
                </div>
              </div>
            </section>

            <section className={`${styles.callout} ${styles.calloutDefinition}`}>
              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-platinum-200 flex-shrink-0 mt-1" />
                <div>
                  <h3>Right to Data Portability</h3>
                  <p>
                    You have the right to request that we transfer your data to another organization
                    or directly to you in a structured, machine-readable format.
                  </p>
                </div>
              </div>
            </section>

            <section className={`${styles.callout} ${styles.calloutDefinition}`}>
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-platinum-200 flex-shrink-0 mt-1" />
                <div>
                  <h3>Right to Restrict Processing</h3>
                  <p>
                    You have the right to request that we restrict the processing of your personal
                    data under certain conditions.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

            <h2>2. How We Process Your Data</h2>
            <h3>Legal Basis for Processing</h3>
            <p>We process your personal data based on the following legal grounds:</p>
            <ul>
              <li>
                <strong>Contractual Necessity</strong> - To provide you with our services as outlined
                in our Terms of Service
              </li>
              <li>
                <strong>Legitimate Interest</strong> - To improve our services, prevent fraud, and
                ensure security
              </li>
              <li>
                <strong>Consent</strong> - Where you have explicitly consented to specific data
                processing activities
              </li>
              <li>
                <strong>Legal Obligation</strong> - To comply with applicable laws and regulations
              </li>
            </ul>

            <h3>Data We Collect</h3>
            <p>We collect and process the following categories of personal data:</p>
            <ul>
              <li>
                <strong>Account Data</strong>: Name, email address, encrypted password
              </li>
              <li>
                <strong>Usage Data</strong>: Chat logs, bot configurations, document uploads,
                analytics
              </li>
              <li>
                <strong>Technical Data</strong>: IP address, browser type, device information, cookies
              </li>
              <li>
                <strong>Billing Data</strong>: Payment information (processed securely by Stripe)
              </li>
            </ul>

            <h2>3. Data Storage and Retention</h2>
            <p>
              Your data is stored on secure servers within the European Union and other data centers
              compliant with GDPR requirements:
            </p>
            <ul>
              <li>
                <strong>Primary Storage</strong>: Neon Database (PostgreSQL) with data residency in
                EU regions
              </li>
              <li>
                <strong>Edge Computing</strong>: Cloudflare Workers for processing (complies with EU
                data protection laws)
              </li>
              <li>
                <strong>Retention Period</strong>: We retain your data for as long as your account is
                active or as needed to provide services
              </li>
            </ul>

            <h2>4. Data Transfers Outside the EEA</h2>
            <p>
              When we transfer data outside the EEA, we ensure adequate protection through:
            </p>
            <ul>
              <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
              <li>Privacy Shield certification (where applicable)</li>
              <li>Other appropriate safeguards as required by GDPR</li>
            </ul>

            <h2>5. Third-Party Processors</h2>
            <p>We share your data with the following GDPR-compliant processors:</p>
            <ul>
              <li>
                <strong>OpenAI, Anthropic, Google</strong> - AI model inference (subject to their
                GDPR-compliant data processing agreements)
              </li>
              <li>
                <strong>Stripe</strong> - Payment processing (PCI-DSS compliant)
              </li>
              <li>
                <strong>Cloudflare</strong> - Hosting and CDN (GDPR compliant, EU data centers
                available)
              </li>
              <li>
                <strong>Neon</strong> - Database hosting (GDPR compliant, EU data residency)
              </li>
            </ul>

            <h2>6. Data Security</h2>
            <p>We implement industry-standard security measures:</p>
            <ul>
              <li>AES-256 encryption at rest</li>
              <li>TLS 1.3 encryption in transit</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliance</li>
              <li>Role-based access controls</li>
              <li>Multi-factor authentication for accounts</li>
            </ul>

            <h2>7. Automated Decision-Making and Profiling</h2>
            <p>
              We do not use your personal data for automated decision-making or profiling that would
              have legal or similarly significant effects on you, except where:
            </p>
            <ul>
              <li>It is necessary for entering into or performing a contract with you</li>
              <li>You have given your explicit consent</li>
              <li>It is authorized by applicable law</li>
            </ul>

            <h2>8. How to Exercise Your Rights</h2>
            <p>To exercise any of your GDPR rights, you can:</p>
            <ul>
              <li>
                <strong>Access and Update Data</strong>: Log into your account dashboard
              </li>
              <li>
                <strong>Delete Account</strong>: Go to Settings → Account → Delete Account
              </li>
              <li>
                <strong>Data Export</strong>: Go to Settings → Privacy → Export My Data
              </li>
              <li>
                <strong>Other Requests</strong>: Email us at{' '}
                <a href="mailto:privacy@chatbot-studio.com">privacy@chatbot-studio.com</a>
              </li>
            </ul>
            <p>We will respond to your request within 30 days as required by GDPR.</p>

            <h2>9. Data Protection Officer</h2>
            <p>
              For questions about our GDPR compliance or to exercise your rights, contact our Data
              Protection Officer:
            </p>
            <ul>
              <li>
                Email: <a href="mailto:dpo@chatbot-studio.com">dpo@chatbot-studio.com</a>
              </li>
              <li>Address: Data Protection Officer, OMNICAL STUDIO, 123 Innovation Street, San Francisco, CA 94105</li>
            </ul>

            <h2>10. Supervisory Authority</h2>
            <p>
              If you believe we are not handling your data in accordance with GDPR, you have the
              right to lodge a complaint with your local data protection authority. For EEA
              residents, you can find your supervisory authority at:{' '}
              <a
                href="https://edpb.europa.eu/about-edpb/board/members_en"
                target="_blank"
                rel="noopener noreferrer"
              >
                https://edpb.europa.eu/about-edpb/board/members_en
              </a>
            </p>

            <h2>11. Updates to This Policy</h2>
            <p>
              We may update this GDPR compliance statement from time to time. We will notify you of
              any material changes by email or through a prominent notice on our website.
            </p>

            <h2>12. Contact Us</h2>
            <p>For any questions about GDPR compliance or data protection:</p>
            <ul>
              <li>
                Email: <a href="mailto:privacy@chatbot-studio.com">privacy@chatbot-studio.com</a>
              </li>
              <li>
                View our full <Link href="/legal/privacy">Privacy Policy</Link>
              </li>
              <li>
                Visit our <Link href="/contact">Contact Page</Link>
              </li>
            </ul>
      </article>
    </div>
  );
}
