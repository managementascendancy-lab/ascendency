import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Renders Google's own "Sign in with Google" button and forwards the
// resulting ID token credential to the caller for server-side verification.
export default function GoogleSignInButton({ onCredential, onError }) {
  const { t } = useTranslation("auth");
  const divRef = useRef(null);
  const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !divRef.current) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onCredential(response.credential),
        });
        window.google.accounts.id.renderButton(divRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          width: 344,
        });
      })
      .catch(() => onError && onError(t("googleLoadFailed")));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  if (!clientId) {
    return (
      <div className="border border-dashed border-bronze/40 px-4 py-3 text-center font-mono text-[11px] text-bronze">
        {t("googleNotConfigured")}
      </div>
    );
  }

  return <div ref={divRef} className="flex justify-center" data-testid="google-signin-btn" />;
}
