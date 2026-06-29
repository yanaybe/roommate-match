import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Privacy Policy</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 max-w-2xl mx-auto"
      >
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last updated: June 29, 2026</p>
          <p className="text-xs text-muted-foreground">Effective date: June 29, 2026</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          RooMatch ("we," "our," or "us") is committed to protecting your personal information and your right to privacy. This Privacy Policy describes how we collect, use, store, disclose, and safeguard your information when you use our platform, including our website and mobile application (collectively, the "Service"). This policy is designed to comply with the Israeli Privacy Protection Law (5741-1981) and its regulations, as well as international best practices for data protection.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          By using the Service, you consent to the data practices described in this Privacy Policy. If you do not agree with the terms of this policy, please do not use the Service.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Information We Collect</h2>
          <p className="text-sm font-semibold text-foreground">1.1 Information You Provide Directly</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Account information: email address, name, age, and password (stored in hashed form)",
              "Profile information: city, neighborhood, occupation, budget, move-in date, desired room type",
              "Lifestyle data: sleep schedule, cleanliness level, cooking habits, social habits, noise preferences, smoking/alcohol/pet status, fitness activity, work-from-home status, and religious level",
              "Preferences: preferred roommate age range, gender preference, lifestyle similarity expectations",
              "Profile photos: images you upload to your profile",
              "Bio and self-description text",
              "Messages you send to other users through the in-app chat",
              "Support messages and feedback you send to us",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-sm font-semibold text-foreground mt-3">1.2 Information Collected Automatically</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Usage data: pages visited, features used, swipe activity, search queries, time spent in-app",
              "Device information: device type, operating system, browser type, unique device identifiers",
              "Log data: IP address, access times, referring URLs, crash reports",
              "Authentication events: login timestamps and methods used",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-sm font-semibold text-foreground mt-3">1.3 Information from Third Parties</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you choose to register or sign in using Google OAuth, we receive basic profile information from Google (name, email address, and profile photo) as permitted by your Google account settings. We do not receive your Google password.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">We use the information we collect for the following purposes:</p>
          <ul className="space-y-1.5 list-none">
            {[
              "Providing and operating the Service, including creating and maintaining your account",
              "Calculating compatibility scores and generating roommate matches using our 14-factor lifestyle algorithm",
              "Displaying your profile to other users who may be compatible roommates",
              "Enabling in-app messaging between matched users",
              "Processing subscription payments and managing your billing",
              "Sending transactional emails (account verification, password reset, match notifications)",
              "Responding to your support requests and feedback",
              "Analyzing aggregated usage trends to improve the Service",
              "Detecting and preventing fraud, abuse, and security incidents",
              "Complying with legal obligations and enforcing our Terms of Service",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. How We Share Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell, rent, or trade your personal information to third parties for marketing purposes. We may share your information in the following limited circumstances:
          </p>
          <p className="text-sm font-semibold text-foreground mt-2">3.1 With Other Users</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your profile information — including your name, age, city, occupation, lifestyle preferences, photos, and bio — is visible to other registered users of the Service for the purpose of roommate matching. Your email address and contact details are never shared directly with other users.
          </p>
          <p className="text-sm font-semibold text-foreground mt-2">3.2 With Service Providers</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We work with trusted third-party service providers who assist us in operating the Service. These include:
          </p>
          <ul className="space-y-1 list-none">
            {[
              "Supabase (database, authentication, and file storage — servers located in the EU)",
              "Vercel (web hosting and deployment infrastructure)",
              "Google (OAuth authentication and analytics)",
              "Payment processors (for Premium Plan billing)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            These providers are contractually required to handle your information confidentially and only for the purposes we specify.
          </p>
          <p className="text-sm font-semibold text-foreground mt-2">3.3 Legal Requirements</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that such disclosure is necessary to protect our rights, prevent fraud, or protect the safety of our users or the public.
          </p>
          <p className="text-sm font-semibold text-foreground mt-2">3.4 Business Transfers</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            In the event of a merger, acquisition, restructuring, or sale of all or substantially all of our assets, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our website before your information is transferred and becomes subject to a different privacy policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement industry-standard technical and organizational security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include:
          </p>
          <ul className="space-y-1.5 list-none">
            {[
              "TLS/HTTPS encryption for all data in transit",
              "Encrypted storage of passwords using bcrypt hashing",
              "Row-level security policies enforced at the database level",
              "Access controls limiting which team members can access production data",
              "Regular security reviews of our codebase and infrastructure",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            No method of transmission over the Internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security. In the event of a data breach affecting your rights, we will notify you as required by applicable law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to provide you with the Service. Specifically:
          </p>
          <ul className="space-y-1.5 list-none">
            {[
              "Profile and account data: retained while your account is active and for up to 90 days after deletion",
              "Messages: retained for the duration of both participants' account activity",
              "Support messages: retained for up to 2 years for quality and legal purposes",
              "Analytics data: retained in aggregated, anonymized form indefinitely",
              "Billing records: retained for 7 years as required by Israeli tax law",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Under the Israeli Privacy Protection Law (5741-1981) and applicable regulations, you have the following rights with respect to your personal information:
          </p>
          <ul className="space-y-1.5 list-none">
            {[
              "Right of access: request a copy of the personal information we hold about you",
              "Right to rectification: request correction of inaccurate or incomplete information",
              "Right to deletion: request deletion of your account and associated personal data",
              "Right to object: object to certain processing of your personal information",
              "Right to data portability: receive your data in a commonly used, machine-readable format",
              "Right to withdraw consent: where processing is based on consent, withdraw it at any time",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary shrink-0 mt-0.5">·</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2">
            To exercise any of these rights, please contact us at roomatchltd@gmail.com. We will respond to your request within 30 days. Account deletion is available directly through Account Settings → Delete Account in the app.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Cookies & Local Storage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use browser local storage and session storage to maintain your authentication state, remember your language preference, and preserve your onboarding progress. We do not use third-party advertising cookies. We may use first-party analytics cookies to understand how users navigate the Service. You can clear local storage through your browser settings, but doing so will log you out and reset your preferences.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Children's Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Service is intended exclusively for users who are 18 years of age or older. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that we have inadvertently collected data from a minor, we will take immediate steps to delete that information and terminate the associated account. If you believe a minor has created an account, please contact us at roomatchltd@gmail.com.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. International Data Transfers</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your information may be stored and processed on servers located outside of Israel, including in the European Union (Supabase infrastructure) and the United States (Vercel). We ensure that any international transfer of personal data is conducted in accordance with applicable data protection laws and that appropriate safeguards are in place to protect your information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">10. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be communicated to you via email or a prominent in-app notification at least 14 days before they take effect. The "Last updated" date at the top of this page will always reflect when the most recent changes were made. Your continued use of the Service after any changes indicates your acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">11. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-foreground">RooMatch — Privacy</p>
            <p className="text-sm text-muted-foreground">Email: roomatchltd@gmail.com</p>
            <p className="text-sm text-muted-foreground">Instagram: @_roomatch</p>
            <p className="text-sm text-muted-foreground">Response time: within 30 days</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
