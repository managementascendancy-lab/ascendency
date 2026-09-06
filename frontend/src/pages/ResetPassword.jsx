import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import HudPanel from "@/components/HudPanel";
import AscButton from "@/components/AscButton";
import NeuralTrace from "@/components/NeuralTrace";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import { Sep } from "@/components/Sep";
import PasswordField from "@/components/PasswordField";
import { passwordMeetsRequirements } from "@/lib/passwordRequirements";
import { useLocalizedNavigate, useLocalizedPath } from "@/i18n/links";

export default function ResetPassword() {
  const { t } = useTranslation("resetPassword");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { resetPassword } = useAuth();
  const { play } = useSound();
  const navigate = useLocalizedNavigate();
  const authHref = useLocalizedPath("/auth");

  const requirementLabels = {
    length: t("passwordRequirements.length"),
    upper: t("passwordRequirements.upper"),
    lower: t("passwordRequirements.lower"),
    digit: t("passwordRequirements.digit"),
    special: t("passwordRequirements.special"),
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t("mismatchError"));
      play("error");
      return;
    }
    setBusy(true);
    const res = await resetPassword(token, password);
    setBusy(false);
    if (res.ok) {
      play("boot");
      navigate("/auth?reset=success");
    } else {
      setError(res.error);
      play("error");
    }
  };

  if (!token) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center py-16">
        <SEO title={t("seo.title")} description={t("seo.noTokenDescription")} />
        <HudPanel type="primary" label={<>{t("networkAccess")}<Sep tone="red" />{t("heading")}</>} status={t("errorStatus")} className="w-full max-w-md" bodyClassName="p-6">
          <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="reset-no-token">
            {t("noToken")}
          </div>
          <Link
            to={authHref}
            className="mt-4 block w-full text-center font-mono text-xs text-cream/50 transition-colors hover:text-cream"
            data-testid="reset-back-link"
          >
            {t("backToAuthenticate")}
          </Link>
        </HudPanel>
      </section>
    );
  }

  return (
    <section className="flex min-h-[80vh] items-center justify-center py-16">
      <SEO title={t("seo.title")} description={t("seo.description")} />
      <HudPanel type="primary" label={<>{t("networkAccess")}<Sep tone="red" />{t("heading")}</>} status={t("secureStatus")} className="w-full max-w-md" bodyClassName="p-6">
        <p className="font-body text-sm text-cream/70">{t("prompt")}</p>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="tech-label text-gold-bright">{t("fields.newAccessKey")}</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              showLabel={t("showAccessKey")}
              hideLabel={t("hideAccessKey")}
              showRequirements
              requirementLabels={requirementLabels}
              data-testid="reset-password"
              className="mt-1"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="tech-label text-gold-bright">{t("fields.confirmAccessKey")}</label>
            <PasswordField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              showLabel={t("showAccessKey")}
              hideLabel={t("hideAccessKey")}
              data-testid="reset-password-confirm"
              className="mt-1"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="reset-error">
              {error}
            </div>
          )}

          <NeuralTrace intensity={busy ? 3 : 1} className="my-2" />

          <AscButton
            type="submit"
            variant="red"
            disabled={busy || !passwordMeetsRequirements(password)}
            className="w-full justify-center"
            data-testid="reset-submit"
          >
            {busy ? t("transmitting") : t("submitButton")}
          </AscButton>
        </form>
      </HudPanel>
    </section>
  );
}
