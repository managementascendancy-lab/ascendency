import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";
import HudPanel from "@/components/HudPanel";
import AscButton from "@/components/AscButton";
import NeuralTrace from "@/components/NeuralTrace";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import { Sep } from "@/components/Sep";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import PasswordField from "@/components/PasswordField";
import { passwordMeetsRequirements, PASSWORD_MIN_LENGTH } from "@/lib/passwordRequirements";
import { useLocalizedNavigate } from "@/i18n/links";

export default function Auth() {
  const { t } = useTranslation("auth");
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [googleSetup, setGoogleSetup] = useState(null); // { email, setupToken } while a new Google account needs a callsign + access key
  const { login, register, loginWithGoogle, completeGoogleSignup, forgotPassword } = useAuth();
  const { play } = useSound();
  const navigate = useLocalizedNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const requirementLabels = {
    length: t("passwordRequirements.length"),
    upper: t("passwordRequirements.upper"),
    lower: t("passwordRequirements.lower"),
    digit: t("passwordRequirements.digit"),
    special: t("passwordRequirements.special"),
  };

  const handleGoogleCredential = async (credential) => {
    setError("");
    setBusy(true);
    const res = await loginWithGoogle(credential);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      play("error");
      return;
    }
    if (res.needsSetup) {
      setUsername("");
      setPassword("");
      // prefilled from Google's own profile data, but still shown and
      // editable — the ascendant confirms the name, it isn't taken silently.
      setFirstName(res.firstName || "");
      setLastName(res.lastName || "");
      setGoogleSetup({ email: res.email, setupToken: res.setupToken });
      play("click");
      return;
    }
    play("boot");
    navigate("/simulator");
  };

  const submitGoogleSetup = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await completeGoogleSignup(googleSetup.setupToken, username, password, firstName, lastName);
    setBusy(false);
    if (res.ok) {
      play("boot");
      navigate("/simulator");
    } else {
      setError(res.error);
      play("error");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res =
      mode === "login"
        ? await login(email, password)
        : await register(email, username, password, firstName, lastName);
    setBusy(false);
    if (res.ok) {
      play("boot");
      navigate("/simulator");
    } else {
      setError(res.error);
      play("error");
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await forgotPassword(email);
    setBusy(false);
    if (res.ok) {
      setForgotSent(true);
      play("boot");
    } else {
      setError(res.error);
      play("error");
    }
  };

  const field =
    "w-full border border-bronze/50 bg-navy px-4 py-3 font-mono text-sm text-cream placeholder:text-cream/35 focus:border-gold-bright focus:outline-none";

  if (googleSetup) {
    return (
      <section className="flex min-h-[80vh] items-center justify-center py-16">
        <SEO title={t("seo.googleSetup.title")} description={t("seo.googleSetup.description")} />
        <HudPanel type="primary" label={<>{t("networkAccess")}<Sep tone="red" />{t("googleSetup.heading")}</>} status={t("secureStatus")} className="w-full max-w-md" bodyClassName="p-6">
          <p className="font-body text-sm text-cream/70">
            {t("googleSetup.verifiedPrefix")}<span className="text-gold-bright">{googleSetup.email}</span>{t("googleSetup.verifiedSuffix")}
          </p>

          <form onSubmit={submitGoogleSetup} className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="tech-label text-gold-bright">{t("fields.firstName")}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  maxLength={50}
                  autoFocus
                  data-testid="google-setup-first-name"
                  className={`mt-1 ${field}`}
                  placeholder={t("fields.firstNamePlaceholder")}
                />
              </div>
              <div>
                <label className="tech-label text-gold-bright">{t("fields.lastName")}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  maxLength={50}
                  data-testid="google-setup-last-name"
                  className={`mt-1 ${field}`}
                  placeholder={t("fields.lastNamePlaceholder")}
                />
              </div>
            </div>
            <div>
              <label className="tech-label text-gold-bright">{t("fields.callsign")}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                data-testid="google-setup-username"
                className={`mt-1 ${field}`}
                placeholder={t("fields.callsignPlaceholder")}
              />
            </div>
            <div>
              <label className="tech-label text-gold-bright">{t("fields.accessKey")}</label>
              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showLabel={t("showAccessKey")}
                hideLabel={t("hideAccessKey")}
                showRequirements
                requirementLabels={requirementLabels}
                data-testid="google-setup-password"
                className="mt-1"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="auth-error">
                {error}
              </div>
            )}

            <NeuralTrace intensity={busy ? 3 : 1} className="my-2" />

            <AscButton type="submit" variant="red" disabled={busy || !passwordMeetsRequirements(password)} className="w-full justify-center" data-testid="google-setup-submit">
              {busy ? t("connecting") : t("initializeProfileButton")}
            </AscButton>
            <button
              type="button"
              onClick={() => {
                setGoogleSetup(null);
                setError("");
              }}
              className="w-full font-mono text-xs text-cream/50 transition-colors hover:text-cream"
              data-testid="google-setup-cancel"
            >
              {t("cancel")}
            </button>
          </form>
        </HudPanel>
      </section>
    );
  }

  if (mode === "forgot") {
    return (
      <section className="flex min-h-[80vh] items-center justify-center py-16">
        <SEO title={t("seo.forgot.title")} description={t("seo.forgot.description")} />
        <HudPanel type="primary" label={<>{t("networkAccess")}<Sep tone="red" />{t("forgot.heading")}</>} status={t("secureStatus")} className="w-full max-w-md" bodyClassName="p-6">
          {forgotSent ? (
            <>
              <p className="font-body text-sm text-cream/70" data-testid="auth-forgot-sent">
                {t("forgot.sentMessage")}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setForgotSent(false);
                  setError("");
                }}
                className="mt-4 w-full font-mono text-xs text-cream/50 transition-colors hover:text-cream"
                data-testid="auth-forgot-back"
              >
                {t("forgot.backToAuthenticate")}
              </button>
            </>
          ) : (
            <form onSubmit={submitForgot} className="space-y-3">
              <p className="font-body text-sm text-cream/70">{t("forgot.prompt")}</p>
              <div>
                <label className="tech-label text-gold-bright">{t("fields.email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  data-testid="auth-forgot-email"
                  className={`mt-1 ${field}`}
                  placeholder={t("fields.emailPlaceholder")}
                />
              </div>

              {error && (
                <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="auth-error">
                  {error}
                </div>
              )}

              <NeuralTrace intensity={busy ? 3 : 1} className="my-2" />

              <AscButton type="submit" variant="red" disabled={busy} className="w-full justify-center" data-testid="auth-forgot-submit">
                {busy ? t("forgot.transmitting") : t("forgot.sendButton")}
              </AscButton>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                className="w-full font-mono text-xs text-cream/50 transition-colors hover:text-cream"
                data-testid="auth-forgot-cancel"
              >
                {t("cancel")}
              </button>
            </form>
          )}
        </HudPanel>
      </section>
    );
  }

  return (
    <section className="flex min-h-[80vh] items-center justify-center py-16">
      <SEO title={t("seo.login.title")} description={t("seo.login.description")} />
      <HudPanel type="primary" label={<>{t("networkAccess")}<Sep tone="red" />{mode === "login" ? t("tabs.login") : t("tabs.register")}</>} status={t("secureStatus")} className="w-full max-w-md" bodyClassName="p-6">
        <div className="mb-4 flex border border-bronze/40">
          {["login", "register"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError("");
                play("click");
              }}
              data-testid={`auth-tab-${m}`}
              className={`flex-1 py-2 font-display text-xs tracking-[0.15em] transition-colors ${
                mode === m ? "bg-gold-bright text-navy-dark" : "text-cream/70 hover:text-cream"
              }`}
            >
              {m === "login" ? t("tabs.login") : t("tabs.register")}
            </button>
          ))}
        </div>

        {resetSuccess && mode === "login" && (
          <div className="mb-3 border border-sage/60 bg-sage/10 px-3 py-2 font-mono text-xs text-sage" data-testid="auth-reset-success">
            {t("resetSuccessBanner")}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="tech-label text-gold-bright">{t("fields.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="auth-email"
              className={`mt-1 ${field}`}
              placeholder={t("fields.emailPlaceholder")}
            />
          </div>
          {mode === "register" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="tech-label text-gold-bright">{t("fields.firstName")}</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    maxLength={50}
                    data-testid="auth-first-name"
                    className={`mt-1 ${field}`}
                    placeholder={t("fields.firstNamePlaceholder")}
                  />
                </div>
                <div>
                  <label className="tech-label text-gold-bright">{t("fields.lastName")}</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    maxLength={50}
                    data-testid="auth-last-name"
                    className={`mt-1 ${field}`}
                    placeholder={t("fields.lastNamePlaceholder")}
                  />
                </div>
              </div>
              <div>
                <label className="tech-label text-gold-bright">{t("fields.callsign")}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                  data-testid="auth-username"
                  className={`mt-1 ${field}`}
                  placeholder={t("fields.callsignPlaceholder")}
                />
              </div>
            </>
          )}
          <div>
            <label className="tech-label text-gold-bright">{t("fields.accessKey")}</label>
            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === "register" ? PASSWORD_MIN_LENGTH : 6}
              showLabel={t("showAccessKey")}
              hideLabel={t("hideAccessKey")}
              showRequirements={mode === "register"}
              requirementLabels={requirementLabels}
              data-testid="auth-password"
              className="mt-1"
              placeholder="••••••••"
            />
            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setForgotSent(false);
                  setError("");
                  play("click");
                }}
                className="mt-1.5 font-mono text-xs text-cream/50 transition-colors hover:text-gold-bright"
                data-testid="auth-forgot-link"
              >
                {t("forgotLink")}
              </button>
            )}
          </div>

          {error && (
            <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="auth-error">
              {error}
            </div>
          )}

          <NeuralTrace intensity={busy ? 3 : 1} className="my-2" />

          <AscButton
            type="submit"
            variant="red"
            disabled={busy || (mode === "register" && !passwordMeetsRequirements(password))}
            className="w-full justify-center"
            data-testid="auth-submit"
          >
            {busy ? t("connecting") : mode === "login" ? t("authenticateButton") : t("initializeProfileButton")}
          </AscButton>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-bronze/30" />
          <span className="tech-label text-bronze">{t("or")}</span>
          <span className="h-px flex-1 bg-bronze/30" />
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} onError={setError} />
      </HudPanel>
    </section>
  );
}
