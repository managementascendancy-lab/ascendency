import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SEO from "@/components/SEO";
import HudPanel from "@/components/HudPanel";
import AscButton from "@/components/AscButton";
import NeuralTrace from "@/components/NeuralTrace";
import { useAuth } from "@/context/AuthContext";
import { useSound } from "@/context/SoundContext";
import { Sep } from "@/components/Sep";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const { play } = useSound();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res =
      mode === "login"
        ? await login(email, password)
        : await register(email, username, password);
    setBusy(false);
    if (res.ok) {
      play("boot");
      navigate("/simulator");
    } else {
      setError(res.error);
      play("error");
    }
  };

  const field =
    "w-full border border-bronze/50 bg-navy px-4 py-3 font-mono text-sm text-cream placeholder:text-cream/35 focus:border-gold-bright focus:outline-none";

  return (
    <section className="flex min-h-[80vh] items-center justify-center py-16">
      <SEO title="Access | Ascendancy" description="Access the Ascendancy network. Log in or register your ascendant profile." />
      <HudPanel type="primary" label={<>NETWORK ACCESS<Sep tone="red" />{mode === "login" ? "AUTHENTICATE" : "REGISTER"}</>} status="SECURE" className="w-full max-w-md" bodyClassName="p-6">
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
              {m === "login" ? "AUTHENTICATE" : "REGISTER"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="tech-label text-gold-bright">ASCENDANT EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="auth-email"
              className={`mt-1 ${field}`}
              placeholder="operator@ascendancy.io"
            />
          </div>
          {mode === "register" && (
            <div>
              <label className="tech-label text-gold-bright">CALLSIGN</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={20}
                data-testid="auth-username"
                className={`mt-1 ${field}`}
                placeholder="NOVA_01"
              />
            </div>
          )}
          <div>
            <label className="tech-label text-gold-bright">ACCESS KEY</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              data-testid="auth-password"
              className={`mt-1 ${field}`}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="border border-red/60 bg-red/10 px-3 py-2 font-mono text-xs text-red" data-testid="auth-error">
              {error}
            </div>
          )}

          <NeuralTrace intensity={busy ? 3 : 1} className="my-2" />

          <AscButton type="submit" variant="red" disabled={busy} className="w-full justify-center" data-testid="auth-submit">
            {busy ? "CONNECTING..." : mode === "login" ? "AUTHENTICATE →" : "INITIALIZE PROFILE →"}
          </AscButton>
        </form>
      </HudPanel>
    </section>
  );
}
