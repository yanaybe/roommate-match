import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TermsOfService() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28 desk:pb-8">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Terms of Service</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-6 space-y-6 max-w-2xl mx-auto"
      >
        <p className="text-xs text-muted-foreground">Last updated: March 29, 2026</p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using the Roomatch application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service. We reserve the right to update these Terms at any time, and your continued use of the Service constitutes acceptance of any changes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Eligibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be at least 18 years of age to use this Service. By using Roomatch, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into a binding agreement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Account Registration</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To use certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to keep your account information updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. User Conduct</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree not to use the Service to: (a) harass, abuse, or harm another person; (b) post false, misleading, or fraudulent content; (c) impersonate any person or entity; (d) violate any applicable law or regulation; (e) upload viruses or malicious code; (f) collect information about other users without their consent; or (g) use the Service for any commercial purpose not expressly permitted.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. Subscriptions & Payments</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Roomatch offers free and premium subscription plans. By purchasing a subscription, you agree to pay the applicable fees. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current billing period. Refunds are subject to our refund policy and applicable law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Content & Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You retain ownership of the content you post on Roomatch. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Service. All trademarks, logos, and service marks displayed on the Service are our property or the property of their respective owners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Roomatch shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or in connection with your use of the Service. Our total liability shall not exceed the amount you paid to us in the twelve months preceding the claim.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may suspend or terminate your account at any time, with or without cause, and with or without notice. Upon termination, your right to use the Service will immediately cease. You may delete your account at any time through the app settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Dispute Resolution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with applicable arbitration rules. You agree to waive any right to a jury trial or to participate in a class action.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">10. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about these Terms, please contact us at roomatchltd@gmail.com.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
