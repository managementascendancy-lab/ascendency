import React from "react";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import Reveal from "@/components/Reveal";
import { DEFAULT_LOCALE } from "@/i18n/locales";

const SECTIONS = [
  {
    title: "1. Introduction",
    body: `This Privacy Policy explains how Ascendancy ("we", "us", "the network") collects, uses and protects information when you use this website. By using Ascendancy, you agree to the practices described here.`,
  },
  {
    title: "2. Information We Collect",
    body: `Account information: if you register, we collect your email address, a username, and a securely hashed password (we never store your password in plain text).

Performance data: when you run a simulation, we record your words-per-minute, accuracy, consistency, score, hero classification, and simulation history, so we can display your profile, achievements and leaderboard ranking.

Automatically collected data: we use cookies to keep you signed in (an authentication session), and standard server logs may record your IP address and browser information for security and abuse prevention.`,
  },
  {
    title: "3. How We Use Information",
    body: `We use your information to operate your account, calculate and display your hero classification and statistics, maintain the leaderboard, and keep the service secure. We do not sell your personal information to third parties.`,
  },
  {
    title: "4. Cookies",
    body: `Ascendancy uses httpOnly authentication cookies to keep you logged in. These are required for account features to work. If advertising is enabled on this site, third-party ad providers (such as Google) may also set cookies to serve and measure ads — you can control ad personalization through your browser or Google's Ads Settings.`,
  },
  {
    title: "5. Third-Party Services",
    body: `We use third-party infrastructure providers (such as MongoDB Atlas) to host account and performance data. If advertising is active on this site, we may also use Google AdSense, which has its own privacy practices governing the data it collects.`,
  },
  {
    title: "6. Data Retention & Your Rights",
    body: `We retain your account and performance data for as long as your account is active. You may request access to, correction of, or deletion of your data at any time by contacting us using the details below.`,
  },
  {
    title: "7. Children's Privacy",
    body: `Ascendancy is not directed at children under 13, and we do not knowingly collect personal information from children under 13.`,
  },
  {
    title: "8. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. Material changes will be reflected by updating the date below.`,
  },
  {
    title: "9. Contact",
    body: `Questions about this policy can be directed to the network administrator via the contact details on this site.`,
  },
];

export default function PrivacyPolicy() {
  const { t, i18n } = useTranslation("legal");
  return (
    <div className="py-14">
      <SEO title="Privacy Policy | Ascendancy" description="How Ascendancy collects, uses and protects your information." />
      <Reveal>
        <span className="tech-label text-gold-bright">LEGAL</span>
        <h1 className="mt-2 font-display text-4xl font-700 tracking-tight text-cream display-outline sm:text-5xl">
          PRIVACY POLICY
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
        This page is a general-purpose template and is not legal advice. If Ascendancy is operated commercially or
        handles data subject to specific regulations (e.g. GDPR, CCPA), have this reviewed by a legal professional.
      </p>
    </div>
  );
}
