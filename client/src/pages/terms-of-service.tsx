import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/animated-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = "Terms of Service - Conneclify";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <AnimatedLogo size="md" />
              <span className="font-bold text-xl">Conneclify</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <div data-testid="button-theme-toggle">
              <ThemeToggle />
            </div>
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-signup">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 2026</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-4">
              By accessing or using Conneclify ("the Service"), you agree to be bound by these Terms of Service and our{" "}
              <Link href="/privacy-policy" className="text-primary underline" data-testid="link-privacy">
                Privacy Policy
              </Link>
              . If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              Conneclify is a professional SMS messaging platform that enables users to send and receive SMS messages through third-party SMS providers (Twilio, SignalWire, or Telnyx). The Service provides a unified interface for managing conversations, team members, and phone numbers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
            <p className="text-muted-foreground mb-4">
              You must create an account to use the Service. You agree to provide accurate, complete, and current information and keep your account credentials secure. You are responsible for all activities that occur under your account.
            </p>

            <h3 className="text-xl font-medium mb-3">3.2 Account Types</h3>
            <p className="text-muted-foreground mb-4">
              Admin accounts have full access to all features including team management, settings, and provider configuration. Team member accounts have limited access as configured by their admin.
            </p>

            <h3 className="text-xl font-medium mb-3">3.3 Brand & Business Consistency</h3>
            <p className="text-muted-foreground mb-4">
              The business name, website, and contact information you register with must accurately represent your brand. You may only send messages on behalf of the brand or business you have registered. Sending messages for a different business or impersonating another entity is strictly prohibited.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. SMS Provider Integration</h2>
            <p className="text-muted-foreground mb-4">
              The Service requires you to connect your own SMS provider account (Twilio, SignalWire, or Telnyx). You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Maintaining a valid account with your chosen SMS provider</li>
              <li>Paying all fees charged by your SMS provider for messages sent</li>
              <li>Complying with your SMS provider's terms of service and acceptable use policies</li>
              <li>Keeping your provider credentials secure and confidential</li>
              <li>Registering your brand and campaigns with your SMS provider as required (e.g., A2P 10DLC for US messaging)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. A2P SMS Messaging Compliance</h2>
            <p className="text-muted-foreground mb-4">
              All SMS messaging conducted through Conneclify must comply with applicable laws, regulations, and carrier guidelines. Specifically:
            </p>

            <h3 className="text-xl font-medium mb-3">5.1 Express Opt-In Consent</h3>
            <p className="text-muted-foreground mb-4">
              You must obtain express written consent from each recipient before sending any promotional or marketing SMS messages. Consent must be obtained through a clear opt-in process that includes:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>A checkbox (unchecked by default) that the user must actively select</li>
              <li>Clear disclosure language such as: <em>"By providing your phone number and checking this box, you agree to receive text messages from [Your Brand]. Message &amp; data rates may apply. Message frequency varies. Reply STOP to opt out. View our <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link> and <Link href="/terms-of-service" className="text-primary underline">Terms of Service</Link>."</em></li>
              <li>A link to this Terms of Service and the Privacy Policy at every opt-in point</li>
            </ul>
            <p className="text-muted-foreground mb-4">
              Every page or form that collects a phone number (contact pages, donation pages, sign-up forms, etc.) must include this opt-in language and checkbox.
            </p>

            <h3 className="text-xl font-medium mb-3">5.2 Opt-Out (STOP) Handling</h3>
            <p className="text-muted-foreground mb-4">
              You must honor opt-out requests immediately and unconditionally. Standard opt-out keywords that must be supported include: <strong>STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, QUIT</strong>. Recipients who opt out must not receive any further messages except a single confirmation of their opt-out. You must include opt-out instructions in at least one of your campaign sample messages, for example: <em>"Reply STOP to opt out."</em>
            </p>

            <h3 className="text-xl font-medium mb-3">5.3 HELP Response</h3>
            <p className="text-muted-foreground mb-4">
              You must support the <strong>HELP</strong> keyword. Recipients who text HELP should receive a response that includes your brand name, a brief description, contact information, and a reminder that they can reply STOP to opt out.
            </p>

            <h3 className="text-xl font-medium mb-3">5.4 Campaign Consistency</h3>
            <p className="text-muted-foreground mb-4">
              Your registered campaign use case must match the actual messages you send. For example, if you register a marketing campaign, you may not use it to send one-time passwords or transactional notifications. Campaigns must be consistent in:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mb-4">
              <li>Brand name and website used in registration vs. messages sent</li>
              <li>Campaign use case vs. actual message content</li>
              <li>Business email domain (must match your registered company; free email domains like Gmail are not acceptable for large corporations)</li>
              <li>Sample messages submitted must include opt-out language and match the registered use case</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.5 Prohibited Content</h3>
            <p className="text-muted-foreground mb-4">
              You may not use Conneclify or any registered campaign to send messages related to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Cannabis or marijuana products or services</li>
              <li>Hate speech, harassment, or discriminatory content</li>
              <li>Explicit sexual content</li>
              <li>Firearms, weapons, or illegal drugs</li>
              <li>Gambling or sweepstakes (unless explicitly permitted and registered)</li>
              <li>Phishing, fraud, or deceptive practices</li>
              <li>Any content that violates applicable local, state, or federal laws</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.6 Embedded Links and Phone Numbers</h3>
            <p className="text-muted-foreground mb-4">
              If your campaign registration indicates that messages will contain embedded phone numbers or links, your actual messages must include those phone numbers or links. Inconsistency between registered campaign attributes and actual messages may result in campaign rejection or suspension.
            </p>

            <h3 className="text-xl font-medium mb-3">5.7 Working Website Requirement</h3>
            <p className="text-muted-foreground mb-4">
              If your opt-in process is through your website, you must ensure the website URL provided is active, publicly accessible, and accurately reflects your business and opt-in process. Providing a non-functional or inaccurate website URL will result in campaign rejection.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Send spam, unsolicited messages, or messages to recipients who have not provided consent</li>
              <li>Harass, threaten, or harm any person</li>
              <li>Transmit malicious code or content</li>
              <li>Impersonate any person, brand, or entity</li>
              <li>Violate any applicable laws, regulations, or third-party rights</li>
              <li>Interfere with or disrupt the Service or its infrastructure</li>
              <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
              <li>Send messages on behalf of a different business than the one registered with your SMS provider</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Regulatory Compliance</h2>
            <p className="text-muted-foreground mb-4">
              You are solely responsible for ensuring your SMS messaging practices comply with all applicable laws and regulations, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>The Telephone Consumer Protection Act (TCPA)</li>
              <li>The CAN-SPAM Act</li>
              <li>CTIA Messaging Principles and Best Practices</li>
              <li>CTIA Short Code Monitoring Handbook</li>
              <li>Mobile Marketing Association (MMA) guidelines</li>
              <li>State and local messaging regulations</li>
              <li>Carrier and aggregator policies (including A2P 10DLC registration requirements)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Service, including its design, features, and content (excluding user content), is owned by Conneclify and protected by intellectual property laws. You retain ownership of your content but grant us a license to use it solely to provide the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. MESSAGE DELIVERY DEPENDS ON THIRD-PARTY SMS PROVIDERS AND CARRIER NETWORKS OUTSIDE OUR CONTROL.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CONNECLIFY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground mb-4">
              You agree to indemnify and hold harmless Conneclify from any claims, damages, fines, or expenses (including attorney's fees) arising from: your use of the Service, your violation of these Terms, your violation of any applicable messaging laws or regulations, or your violation of any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-muted-foreground mb-4">
              We may suspend or terminate your access to the Service at any time for violation of these Terms, violation of messaging regulations, or for any other reason with or without notice. You may terminate your account at any time through your account settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Changes to Terms</h2>
            <p className="text-muted-foreground mb-4">
              We may modify these Terms at any time. We will notify you of material changes by posting the updated Terms and revising the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground mb-4">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Contact</h2>
            <p className="text-muted-foreground mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong> legal@conneclify.com<br />
              <strong>Website:</strong> conneclify.com
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-muted-foreground">
              See also our{" "}
              <Link href="/privacy-policy" className="text-primary underline" data-testid="link-privacy-footer">
                Privacy Policy
              </Link>{" "}
              for information on how we collect, use, and protect your data.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Conneclify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
