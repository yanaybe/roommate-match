import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-8">
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
        <p className="text-xs text-muted-foreground">Last updated: March 29, 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Roomatch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the "Service").
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Information We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Personal Information:</strong> When you create an account, we collect your name, email address, date of birth, profile photos, and preferences such as budget, location, and lifestyle habits.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Usage Data:</strong> We automatically collect information about how you interact with the Service, including pages visited, features used, swipe activity, and time spent on the app.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Device Information:</strong> We may collect device type, operating system, unique device identifiers, and IP address.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Location Data:</strong> With your consent, we may collect precise or approximate location data to provide location-based features.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. How We Use Your Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use the information we collect to: (a) provide and maintain the Service; (b) match you with compatible roommates and apartments; (c) personalize your experience; (d) process transactions and subscriptions; (e) send you updates, security alerts, and support messages; (f) analyze usage trends to improve the Service; and (g) comply with legal obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Sharing of Information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell your personal information. We may share your information with: (a) other users as part of the matching and messaging features; (b) service providers who assist us in operating the Service; (c) law enforcement or government agencies when required by law; and (d) in connection with a merger, acquisition, or sale of assets.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Data Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement industry-standard security measures to protect your personal information, including encryption in transit and at rest. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Data Retention</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We retain your personal information for as long as your account is active or as needed to provide you with the Service. You may request deletion of your account and associated data at any time. We may retain certain information as required by law or for legitimate business purposes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Depending on your jurisdiction, you may have the right to: (a) access the personal data we hold about you; (b) request correction of inaccurate data; (c) request deletion of your data; (d) object to or restrict processing of your data; (e) data portability; and (f) withdraw consent at any time where processing is based on consent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Cookies & Tracking</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may use cookies, local storage, and similar technologies to enhance your experience, analyze usage, and deliver personalized content. You can manage your cookie preferences through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Children's Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Service is not intended for users under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete it promptly.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">10. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">11. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions or concerns about this Privacy Policy, please contact us at privacy@roomatch.app.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
