import { useState, useEffect } from "react";
import { useSearchParams, useFetcher } from "react-router";

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/>
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"/>
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#0A66C2"/>
      <path fill="#fff" d="M8.5 9.5h-2v7h2v-7zM7.5 8.6a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM17 12.6c0-2-1.1-2.9-2.5-2.9-1.1 0-1.6.6-1.9 1v-.9h-2v7h2v-3.9c0-.6.4-1.2 1.1-1.2s1.1.6 1.1 1.2v3.9h2v-4.2z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#1877F2"/>
      <path fill="#fff" d="M13.5 21v-7h2.3l.3-2.7h-2.6V9.5c0-.8.2-1.3 1.3-1.3h1.4V5.8c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.9H8.8v2.7h2.3v7h2.4z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#000"/>
      <path fill="#fff" d="M6.5 6.5l4.2 5.6-4.4 5.4h1.3l3.8-4.7 3.1 4.7h3l-4.5-6 4.1-5h-1.3l-3.5 4.3-2.8-4.3h-3z"/>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#000"/>
      <path
        fill="#FF9900"
        d="M17.5 15.8c-1.8 1.3-4.3 2-6.5 2-3.1 0-5.9-1.1-8-3-.2-.2 0-.4.2-.3 2.3 1.3 5.1 2.1 8 2.1 2 0 4.1-.4 6.1-1.2.3-.1.5.2.2.4z"
      />
      <path
        fill="#FF9900"
        d="M18.3 14.9c-.2-.3-1.5-.1-2.1-.1-.2 0-.2-.2-.1-.3 1-.7 2.6-.5 2.8-.3.2.3-.1 1.8-1 2.6-.1.1-.3 0-.2-.1.3-.5.7-1.5.6-1.8z"
      />
      <path
        fill="#fff"
        d="M13 8.7v-.4c0-.2.1-.3.3-.3h2c.2 0 .3.1.3.3v.3c0 .2-.2.4-.4.7l-1 1.5c.4 0 .8.1 1.1.3.1 0 .1.1.1.2v.4c0 .1-.1.2-.3.2-.6-.3-1.4-.4-2 0-.1.1-.2 0-.2-.2v-.4c0-.1 0-.2.1-.3l1.2-1.7h-1c-.2 0-.3-.1-.3-.3z"
      />
      <path
        fill="#fff"
        d="M8.7 12h-.6c-.1 0-.2-.1-.2-.2V8.5c0-.1.1-.2.2-.2h.6c.1 0 .2.1.2.2v.4c.3-.4.6-.6 1.1-.6.5 0 .8.2.9.7.3-.5.7-.7 1.2-.7.4 0 .7.1.9.4.3.3.2.7.2 1.1v2.1c0 .1-.1.2-.2.2h-.6c-.1 0-.2-.1-.2-.2V10c0-.2 0-.7-.5-.7-.4 0-.6.4-.6.7v1.8c0 .1-.1.2-.2.2h-.6c-.1 0-.2-.1-.2-.2V10c0-.2 0-.7-.5-.7s-.6.4-.6.7v1.8c0 .1-.1.2-.2.2z"
      />
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingTop: "80px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    background: "#fff",
  },
  card: { width: "340px", textAlign: "center" },
  heading: { fontSize: "32px", fontWeight: 400, marginBottom: "32px" },
  input: {
    width: "100%",
    padding: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    fontSize: "15px",
    marginBottom: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "14px",
    background: "#1a1a1a",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: "8px",
  },
  error: { color: "#d82c0d", fontSize: "13px", marginBottom: "12px" },
  divider: { margin: "24px 0", color: "#999", fontSize: "13px" },
  iconRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginTop: "8px",
  },
  iconButton: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    border: "1px solid #e0e0e0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    background: "#fff",
    textDecoration: "none",
  },
};

export default function SelectProvider() {
  const [searchParams] = useSearchParams();
  const state = searchParams.get("state") || "";
  const redirect_uri = searchParams.get("redirect_uri") || "";
  const nonce = searchParams.get("nonce") || "";

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [now, setNow] = useState(Date.now());

  const sendFetcher = useFetcher();
  const verifyFetcher = useFetcher();

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sendFetcher.data?.success) {
      setStep("code");
      setExpiresAt(Date.now() + sendFetcher.data.expiresInSeconds * 1000);
      setCooldownUntil(Date.now() + sendFetcher.data.cooldownSeconds * 1000);
    }
  }, [sendFetcher.data]);

  const socialUrl = (provider) =>
    `/auth/${provider}?state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&nonce=${encodeURIComponent(nonce)}`;

  const handleSendCode = (e) => {
    e.preventDefault();
    sendFetcher.submit(
      { email, state, redirect_uri, nonce },
      { method: "POST", action: "/auth/email/send-code" },
    );
  };

  const handleResend = () => {
    sendFetcher.submit(
      { email, state, redirect_uri, nonce },
      { method: "POST", action: "/auth/email/send-code" },
    );
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyFetcher.submit(
      { email, code, state, redirect_uri, nonce },
      { method: "POST", action: "/auth/email/verify-code" },
    );
  };

  const secondsLeft = expiresAt ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 0;
  const isExpired = expiresAt && secondsLeft === 0;
  const cooldownLeft = cooldownUntil ? Math.max(0, Math.floor((cooldownUntil - now) / 1000)) : 0;
  const canResend = cooldownLeft === 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.heading}>Login</h1>

        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            {sendFetcher.data?.error && (
              <div style={styles.error}>{sendFetcher.data.error}</div>
            )}
            <button
              type="submit"
              style={styles.button}
              disabled={sendFetcher.state !== "idle"}
            >
              {sendFetcher.state !== "idle" ? "Sending..." : "Continue"}
            </button>
          </form>
        )}

        {step === "code" && (
          <form onSubmit={handleVerify}>
            <p style={{ fontSize: "14px", color: "#555", marginBottom: "8px" }}>
              Enter the code sent to {email}
            </p>

            <p style={{ fontSize: "13px", color: isExpired ? "#d82c0d" : "#888", marginBottom: "16px" }}>
              {isExpired ? "Code expired." : `Expires in ${formatTime(secondsLeft)}`}
            </p>

            <input
              type="text"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={styles.input}
              maxLength={6}
              disabled={isExpired}
              required
            />

            {verifyFetcher.data?.error && (
              <div style={styles.error}>{verifyFetcher.data.error}</div>
            )}

            <button
              type="submit"
              style={styles.button}
              disabled={verifyFetcher.state !== "idle" || isExpired}
            >
              {verifyFetcher.state !== "idle" ? "Verifying..." : "Sign in"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || sendFetcher.state !== "idle"}
              style={{
                background: "none",
                border: "none",
                color: canResend ? "#1a1a1a" : "#999",
                textDecoration: canResend ? "underline" : "none",
                cursor: canResend ? "pointer" : "default",
                fontSize: "13px",
                marginTop: "8px",
              }}
            >
              {canResend ? "Resend code" : `Resend in ${cooldownLeft}s`}
            </button>
          </form>
        )}

        <div style={styles.divider}>OR</div>

        <div style={styles.iconRow}>
          <a href={socialUrl("google")} style={styles.iconButton} title="Continue with Google">
            <GoogleIcon />
          </a>
          <a href={socialUrl("linked")} style={styles.iconButton} title="Continue with LinkedIn">
            <LinkedInIcon />
          </a>
          <a href={socialUrl("facebook")} style={styles.iconButton} title="Continue with Facebook">
            <FacebookIcon />
          </a>
          <a href={socialUrl("twitter")} style={styles.iconButton} title="Continue with X">
            <XIcon />
          </a>
          <a href={socialUrl("amazon")} style={styles.iconButton} title="Continue with Amazon">
            <AmazonIcon />
          </a>
        </div>
      </div>
    </div>
  );
}