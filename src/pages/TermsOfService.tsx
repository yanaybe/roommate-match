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
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Last updated: June 29, 2026</p>
          <p className="text-xs text-muted-foreground">Effective date: June 29, 2026</p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service ("Terms") govern your access to and use of the RooMatch platform, including our website, mobile application, and related services (collectively, the "Service"), operated by RooMatch ("we," "us," or "our"). Please read these Terms carefully before using the Service.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By creating an account, accessing, or using the Service in any way, you agree to be legally bound by these Terms and our Privacy Policy, which is incorporated herein by reference. If you do not agree to these Terms, you must not use the Service. We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. Your continued use of the Service after changes are posted constitutes your acceptance of the updated Terms.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">2. Eligibility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be at least 18 years of age to use the Service. By using RooMatch, you represent and warrant that: (a) you are at least 18 years old; (b) you have the legal capacity to enter into a binding agreement; (c) you are not prohibited from using the Service under applicable law; and (d) the information you provide during registration is accurate, current, and complete. We reserve the right to verify your age and identity and to refuse service to anyone who does not meet these eligibility requirements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">3. Account Registration & Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To access the Service, you must create an account by providing your email address and a password, or by signing in through a supported third-party provider (e.g., Google). You agree to: (a) provide accurate, current, and complete information during registration; (b) maintain and promptly update your account information; (c) keep your login credentials confidential; (d) not share your account with any other person; and (e) notify us immediately at roomatchltd@gmail.com if you suspect any unauthorized use of your account.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You are solely responsible for all activities that occur under your account. We are not liable for any loss or damage resulting from your failure to protect your login credentials.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">4. Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:
          </p>
          <ul className="space-y-1.5 list-none">
            {[
              "Harass, abuse, threaten, stalk, intimidate, or harm any other user",
              "Post false, misleading, fraudulent, defamatory, or deceptive content",
              "Impersonate any person, entity, or organization",
              "Violate any applicable Israeli law, regulation, or third-party right",
              "Upload or transmit viruses, malware, or any malicious code",
              "Collect, harvest, or scrape personal information about other users without their consent",
              "Use the Service for any commercial solicitation not expressly authorized",
              "Create multiple accounts or register on behalf of another person without authorization",
              "Attempt to gain unauthorized access to any part of the Service or its infrastructure",
              "Interfere with or disrupt the integrity or performance of the Service",
              "Post or transmit sexually explicit, violent, discriminatory, or otherwise objectionable content",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-destructive shrink-0 mt-0.5">×</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We reserve the right to investigate and take appropriate action, including account suspension or termination, for any violation of this section.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">5. User Content</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You retain ownership of the content you submit, post, or display on the Service ("User Content"), including profile information, photos, and messages. By submitting User Content, you grant RooMatch a non-exclusive, worldwide, royalty-free, sublicensable license to use, reproduce, modify, adapt, publish, and display such content solely in connection with operating and improving the Service.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You represent and warrant that: (a) you own or have the necessary rights to the User Content you submit; (b) the User Content does not infringe any third-party intellectual property, privacy, or other rights; and (c) the User Content complies with these Terms and all applicable laws. We may remove any User Content that violates these Terms or that we find objectionable, without prior notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">6. Subscriptions & Payments</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            RooMatch offers a free tier and optional paid subscription plans ("Premium Plans"). By subscribing to a Premium Plan, you agree to pay the applicable fees as described on our pricing page. All fees are stated in New Israeli Shekel (₪) and are inclusive of any applicable taxes unless stated otherwise.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Subscriptions automatically renew at the end of each billing period unless you cancel at least 24 hours before the renewal date. You may cancel your subscription at any time through the Account Settings page. Cancellation takes effect at the end of the current billing period; you will retain access to Premium features until then.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Refunds are provided at our discretion in accordance with applicable Israeli consumer protection law. If you believe you are entitled to a refund, please contact us at roomatchltd@gmail.com within 14 days of the charge. We are not responsible for charges resulting from unauthorized access to your account.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">7. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All intellectual property in and to the Service — including but not limited to the RooMatch name, logo, design, software, algorithms, and content created by us — is owned by or licensed to RooMatch and is protected by Israeli and international copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works of any Service content without our prior written consent.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">8. Third-Party Services</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Service may contain links to or integrate with third-party websites, applications, or services (e.g., Google Sign-In, map providers, payment processors). We do not control and are not responsible for the content, privacy practices, or terms of any third-party services. Your use of third-party services is governed by their respective terms and privacy policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">9. Disclaimer of Warranties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. WE DO NOT GUARANTEE THE ACCURACY OR COMPLETENESS OF ANY CONTENT ON THE SERVICE.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            RooMatch is a platform that connects users seeking roommates and apartments. We are not a real estate agent, broker, or property manager. We do not verify the accuracy of apartment listings posted by users and are not responsible for any losses arising from reliance on such listings. You are solely responsible for exercising due diligence before entering into any housing arrangement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">10. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, ROOMATCH AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THE SERVICE EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID TO US IN THE TWELVE MONTHS PRECEDING THE CLAIM; OR (B) ₪100. SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OF LIABILITY FOR PERSONAL INJURY OR CERTAIN OTHER DAMAGES, SO THE ABOVE LIMITATIONS MAY NOT APPLY TO YOU.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">11. Indemnification</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree to indemnify, defend, and hold harmless RooMatch and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with: (a) your access to or use of the Service; (b) your User Content; (c) your violation of these Terms; or (d) your violation of any third-party right, including without limitation any intellectual property, privacy, or property right.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">12. Termination</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may suspend or terminate your account and access to the Service at any time, with or without cause, and with or without notice. Grounds for termination include, but are not limited to, violation of these Terms, fraudulent or abusive behavior, or inactivity for an extended period. Upon termination, your right to use the Service will immediately cease, and we may delete your account data in accordance with our Privacy Policy.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may delete your account at any time through the Account Settings page in the app. Deletion is permanent and cannot be undone. Any active subscriptions will not be automatically refunded upon account deletion.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">13. Governing Law & Dispute Resolution</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            These Terms are governed by and construed in accordance with the laws of the State of Israel, without regard to its conflict of law provisions. Any dispute arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the competent courts located in Tel Aviv, Israel.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Before initiating any legal proceeding, you agree to first attempt to resolve any dispute informally by contacting us at roomatchltd@gmail.com. We will attempt to resolve the dispute within 30 days. If the dispute cannot be resolved informally, either party may pursue available legal remedies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">14. Severability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If any provision of these Terms is found to be invalid, illegal, or unenforceable under applicable law, that provision shall be modified to the minimum extent necessary to make it enforceable, or if modification is not possible, it shall be severed from these Terms, and the remaining provisions shall continue in full force and effect.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-foreground">15. Contact Us</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions, concerns, or complaints about these Terms or the Service, please contact us at:
          </p>
          <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
            <p className="text-sm font-semibold text-foreground">RooMatch</p>
            <p className="text-sm text-muted-foreground">Email: roomatchltd@gmail.com</p>
            <p className="text-sm text-muted-foreground">Instagram: @_roomatch</p>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
