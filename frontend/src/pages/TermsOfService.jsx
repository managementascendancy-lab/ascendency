import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import { DEFAULT_LOCALE } from "@/i18n/locales";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using Ascendancy, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.`,
  },
  {
    title: "2. Description of Service",
    body: `Ascendancy is a typing-speed simulator that measures words-per-minute, accuracy and consistency, and classifies performance into hero tiers. Registered users can save history, track achievements, and appear on a public leaderboard.`,
  },
  {
    title: "3. Accounts",
    body: `You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information when registering.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You agree not to use automated tools, scripts, or bots to submit simulation results, attempt to manipulate the leaderboard, interfere with the service's operation, or attempt to gain unauthorized access to other accounts or systems.`,
  },
  {
    title: "5. Leaderboard, Certificates & Accuracy",
    body: `Simulation results, hero classifications, and downloadable certificates reflect self-reported client-side measurements and are provided for informational and entertainment purposes. Ascendancy does not guarantee the accuracy of any score for professional certification, employment, or academic purposes.`,
  },
  {
    title: "6. Intellectual Property",
    body: `The Ascendancy name, hero classifications, visual design and branding are the property of Ascendancy. You retain ownership of any content you generate (such as downloaded certificates) for personal, non-commercial use and sharing.`,
  },
  {
    title: "7. Disclaimer of Warranties",
    body: `Ascendancy is provided "as is" without warranties of any kind, express or implied. We do not guarantee uninterrupted or error-free operation of the service.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `To the fullest extent permitted by law, Ascendancy shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.`,
  },
  {
    title: "9. Termination",
    body: `We reserve the right to suspend or terminate accounts that violate these Terms, including leaderboard manipulation or abusive behavior.`,
  },
  {
    title: "10. Changes to These Terms",
    body: `We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the updated Terms.`,
  },
  {
    title: "11. Contact",
    body: `Questions about these Terms can be directed to the network administrator via the contact details on this site.`,
  },
];

export default function TermsOfService() {
  const { t, i18n } = useTranslation("legal");
  return (
    <div className="py-14">
      <SEO title="Terms of Service | Ascendancy" description="The terms governing your use of Ascendancy." />
      <Reveal>
        <span className="tech-label text-gold-bright">LEGAL</span>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
          TERMS OF SERVICE
        </h1>
        <p className="mt-3 font-mono text-xs text-sage">LAST UPDATED: SEPTEMBER 2026</p>
      </Reveal>

      {i18n.language !== DEFAULT_LOCALE && (
        <div className="mt-6 max-w-2xl border border-gold-bright/50 bg-gold-bright/10 px-4 py-3 font-mono text-xs text-gold-bright" data-testid="legal-english-only-notice">
          {t("englishOnlyNotice")}
        </div>
      )}

      <div className="mt-10 max-w-2xl space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h2 className="font-display text-lg font-700 tracking-wide text-gold-bright">{s.title}</h2>
            <p className="mt-2 whitespace-pre-line font-body text-sm leading-relaxed text-cream/75">{s.body}</p>
          </div>
        ))}
      </div>

      <p className="mt-12 max-w-2xl font-mono text-[11px] text-bronze">
        This page is a general-purpose template and is not legal advice. If Ascendancy is operated commercially,
        have these terms reviewed by a legal professional before relying on them.
      </p>
    </div>
  );
}
