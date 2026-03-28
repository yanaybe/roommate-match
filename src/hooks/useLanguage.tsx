import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "he" | "fr";

interface LanguageInfo {
  code: Language;
  label: string;
  nativeLabel: string;
  shortCode: string;
  dir: "ltr" | "rtl";
}

export const languages: LanguageInfo[] = [
  { code: "en", label: "English", nativeLabel: "English", shortCode: "EN", dir: "ltr" },
  { code: "he", label: "Hebrew", nativeLabel: "עברית", shortCode: "עב", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", shortCode: "FR", dir: "ltr" },
];

// Translation keys
const translations: Record<Language, Record<string, string>> = {
  en: {
    settings: "Settings",
    subscriptionAndPayments: "Subscription & Payments",
    currentPlan: "Current Plan",
    upgrade: "Upgrade ✨",
    unlockDesc: "Unlock unlimited likes, see who viewed you & more",
    manageSubscription: "Manage Subscription",
    manageSubscriptionDesc: "Upgrade, downgrade or cancel",
    paymentMethods: "Payment Methods",
    paymentMethodsDesc: "Add or remove cards",
    billingHistory: "Billing History",
    billingHistoryDesc: "View past payments",
    activityAndInsights: "Activity & Insights",
    profileViews: "Profile Views",
    likesReceived: "Likes Received",
    matchRate: "Match Rate",
    upgradeFullInsights: "Upgrade to see full insights",
    supportAndLegal: "Support & Legal",
    helpCenter: "Help Center",
    helpCenterDesc: "FAQs and guides",
    contactSupport: "Contact Support",
    contactSupportDesc: "Get in touch with us",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    appSettings: "App Settings",
    language: "Language",
    darkMode: "Dark Mode",
    locationPreferences: "Location Preferences",
    locationPreferencesDesc: "Set your preferred areas",
    selectLanguage: "Select Language",
  },
  he: {
    settings: "הגדרות",
    subscriptionAndPayments: "מנוי ותשלומים",
    currentPlan: "מנוי נוכחי",
    upgrade: "✨ שדרג",
    unlockDesc: "שחרר לייקים ללא הגבלה, ראה מי צפה בך ועוד",
    manageSubscription: "ניהול מנוי",
    manageSubscriptionDesc: "שדרוג, הורדה או ביטול",
    paymentMethods: "אמצעי תשלום",
    paymentMethodsDesc: "הוסף או הסר כרטיסים",
    billingHistory: "היסטוריית חיובים",
    billingHistoryDesc: "צפה בתשלומים קודמים",
    activityAndInsights: "פעילות ותובנות",
    profileViews: "צפיות בפרופיל",
    likesReceived: "לייקים שהתקבלו",
    matchRate: "אחוז התאמה",
    upgradeFullInsights: "שדרג כדי לראות תובנות מלאות",
    supportAndLegal: "תמיכה ומשפטי",
    helpCenter: "מרכז עזרה",
    helpCenterDesc: "שאלות נפוצות ומדריכים",
    contactSupport: "צור קשר עם התמיכה",
    contactSupportDesc: "דבר איתנו",
    termsOfService: "תנאי שימוש",
    privacyPolicy: "מדיניות פרטיות",
    appSettings: "הגדרות אפליקציה",
    language: "שפה",
    darkMode: "מצב כהה",
    locationPreferences: "העדפות מיקום",
    locationPreferencesDesc: "הגדר את האזורים המועדפים",
    selectLanguage: "בחר שפה",
  },
  fr: {
    settings: "Paramètres",
    subscriptionAndPayments: "Abonnement & Paiements",
    currentPlan: "Plan actuel",
    upgrade: "Améliorer ✨",
    unlockDesc: "Débloquez les likes illimités, voyez qui vous a vu et plus",
    manageSubscription: "Gérer l'abonnement",
    manageSubscriptionDesc: "Améliorer, rétrograder ou annuler",
    paymentMethods: "Moyens de paiement",
    paymentMethodsDesc: "Ajouter ou supprimer des cartes",
    billingHistory: "Historique de facturation",
    billingHistoryDesc: "Voir les paiements passés",
    activityAndInsights: "Activité & Statistiques",
    profileViews: "Vues du profil",
    likesReceived: "Likes reçus",
    matchRate: "Taux de match",
    upgradeFullInsights: "Améliorez pour voir toutes les statistiques",
    supportAndLegal: "Support & Légal",
    helpCenter: "Centre d'aide",
    helpCenterDesc: "FAQ et guides",
    contactSupport: "Contacter le support",
    contactSupportDesc: "Nous contacter",
    termsOfService: "Conditions d'utilisation",
    privacyPolicy: "Politique de confidentialité",
    appSettings: "Paramètres de l'app",
    language: "Langue",
    darkMode: "Mode sombre",
    locationPreferences: "Préférences de localisation",
    locationPreferencesDesc: "Définir vos zones préférées",
    selectLanguage: "Choisir la langue",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("roomatch-language") as Language) || "en";
  });

  const languageInfo = languages.find((l) => l.code === language)!;

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("roomatch-language", lang);
  };

  useEffect(() => {
    document.documentElement.dir = languageInfo.dir;
    document.documentElement.lang = language;
  }, [language, languageInfo.dir]);

  const t = (key: string) => translations[language][key] || translations.en[key] || key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir: languageInfo.dir, languageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
