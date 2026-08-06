import { useState, useEffect } from "react";
import { useSearchParams, useFetcher, useLoaderData } from "react-router";
import db from "../db.server";

export const loader = async () => {
  const shop = process.env.SHOP_DOMAIN;

  const settings = shop
    ? await db.shopSettings.findUnique({ where: { shop } })
    : null;

  return {
    logos: {
      google: settings?.googleLogo || null,
      linkedin: settings?.linkedinLogo || null,
      facebook: settings?.facebookLogo || null,
      twitter: settings?.twitterLogo || null,
      amazon: settings?.amazonLogo || null,
    },
    enabled: {
      google: (settings?.appEnabled ?? true) && (settings?.googleEnabled ?? true),
      linkedin: (settings?.appEnabled ?? true) && (settings?.linkedinEnabled ?? true),
      facebook: (settings?.appEnabled ?? true) && (settings?.facebookEnabled ?? true),
      twitter: (settings?.appEnabled ?? true) && (settings?.twitterEnabled ?? true),
      amazon: (settings?.appEnabled ?? true) && (settings?.amazonEnabled ?? true),
    },
  };
};

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.7797 9.82031H12.2463V14.4656H18.8382C18.5464 15.9609 17.6805 17.2266 16.3794 18.075C15.2887 18.7969 13.8966 19.2328 12.251 19.2328C9.0651 19.2328 6.36231 17.1281 5.39122 14.2922H5.37687L5.39122 14.2828C5.14725 13.5609 5.00374 12.7969 5.00374 12.0047C5.00374 11.2125 5.14725 10.4438 5.39122 9.72656C6.35753 6.89062 9.0651 4.78594 12.251 4.78594C14.0545 4.78594 15.657 5.39531 16.9391 6.57656L20.4455 3.14062C18.3168 1.19063 15.5518 0 12.2463 0C7.45778 0 3.32945 2.69531 1.31552 6.62344C0.478369 8.23594 0 10.0594 0 12C0 13.9406 0.478369 15.7641 1.31552 17.3766V17.3859C3.32945 21.3047 7.45778 24 12.2463 24C15.5518 24 18.3263 22.9312 20.3498 21.0984C22.6651 19.0031 23.9998 15.9281 23.9998 12.2719C24.0046 11.4234 23.928 10.6031 23.7797 9.82031Z" fill="#FC4C53"/>
      <path d="M5.39122 14.2922H5.37687L5.39122 14.2828C5.14725 13.5609 5.00374 12.7969 5.00374 12.0047C5.00374 11.2078 5.14725 10.4437 5.39122 9.72656C6.00354 7.93124 7.31427 6.43593 8.99334 5.57343C7.84047 4.07343 6.37188 2.99999 4.73107 2.54062C3.31032 3.63281 2.13353 5.02031 1.31073 6.61874C0.478369 8.23593 0 10.0594 0 12C0 13.9406 0.478369 15.7641 1.31552 17.3766V17.3859C2.6693 20.0109 4.97504 22.0875 7.78785 23.1703C8.96464 22.1156 9.92616 20.6859 10.5911 19.0125C8.1562 18.4312 6.18532 16.6172 5.39122 14.2922Z" fill="url(#paint0_radial_62_112)"/>
      <path d="M1.40649 17.55C3.44913 21.3797 7.52484 24 12.2463 24C15.5519 24 18.3264 22.9312 20.3499 21.0984C22.6652 19.0031 23.9999 15.9281 23.9999 12.2719C23.9999 12.0609 23.9807 11.864 23.9712 11.6578C21.1488 10.7484 17.915 10.4062 14.5377 10.8187C13.7532 10.9125 12.9974 11.0578 12.2511 11.2265V14.4656H18.8431C18.5513 15.9609 17.6854 17.2265 16.3842 18.075C15.2936 18.7969 13.9015 19.2328 12.2559 19.2328C9.06997 19.2328 6.36718 17.1281 5.39609 14.2922H5.38174L5.39609 14.2828C5.37218 14.2125 5.36261 14.1375 5.33869 14.0672C3.78399 15.0656 2.45891 16.2469 1.40649 17.55Z" fill="url(#paint1_radial_62_112)"/>
      <path d="M20.3499 21.0984C22.6652 19.0031 23.9999 15.9281 23.9999 12.2719C23.9999 11.4187 23.9233 10.6031 23.775 9.81561H12.2463V14.4609H18.8383C18.5465 15.9562 17.6806 17.2219 16.3794 18.0703C15.5949 18.5859 14.6525 18.9515 13.5762 19.1156L17.6758 22.8516C18.6708 22.3969 19.5702 21.8062 20.3499 21.0984Z" fill="url(#paint2_linear_62_112)"/>
      <defs>
        <radialGradient id="paint0_radial_62_112" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(2.94718 13.7154) scale(8.63391 11.4201)">
          <stop offset="0.368" stopColor="#FFCF09"/>
          <stop offset="0.718" stopColor="#FFCF09" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#FFCF09" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="paint1_radial_62_112" cx="0" cy="0" r="1" gradientTransform="matrix(17.4158 -2.13158 -1.65034 -12.9515 16.1867 23.7693)" gradientUnits="userSpaceOnUse">
          <stop offset="0.383" stopColor="#34A853"/>
          <stop offset="0.706" stopColor="#34A853" stopOpacity="0.7"/>
          <stop offset="1" stopColor="#34A853" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="paint2_linear_62_112" x1="24.6984" y1="5.43444" x2="12.3041" y2="20.9679" gradientUnits="userSpaceOnUse">
          <stop offset="0.671" stopColor="#4285F4"/>
          <stop offset="0.885" stopColor="#4285F4" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#10539A"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M10.4574 10.1814H12.6858V11.2914C13.0068 10.653 13.83 10.0794 15.0666 10.0794C17.4372 10.0794 18 11.3502 18 13.6818V18H15.6V14.2128C15.6 12.885 15.279 12.1362 14.4618 12.1362C13.3284 12.1362 12.8574 12.9432 12.8574 14.2122V18H10.4574V10.1814ZM6.342 17.898H8.742V10.0794H6.342V17.898ZM9.0858 7.53C9.08589 7.73117 9.04599 7.93034 8.96843 8.11595C8.89087 8.30156 8.77719 8.46991 8.634 8.6112C8.49038 8.75407 8.32002 8.86724 8.13265 8.94425C7.94528 9.02126 7.74458 9.06059 7.542 9.06C7.13376 9.05908 6.74215 8.89817 6.4512 8.6118C6.30858 8.46999 6.19532 8.30145 6.1179 8.11582C6.04048 7.9302 6.00041 7.73113 6 7.53C6 7.1238 6.162 6.735 6.4518 6.4482C6.74202 6.16073 7.13411 5.99963 7.5426 6C7.9518 6 8.3442 6.1614 8.634 6.4482C8.9238 6.735 9.0858 7.1238 9.0858 7.53Z" fill="white"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12C24 5.37263 18.6274 0 12 0C5.37262 0 0 5.37263 0 12C0 17.9895 4.38825 22.954 10.125 23.8542V15.4688H7.07812V12H10.125V9.35625C10.125 6.34875 11.9166 4.6875 14.6576 4.6875C15.9705 4.6875 17.3438 4.92188 17.3438 4.92188V7.875H15.8306C14.3399 7.875 13.875 8.80003 13.875 9.74906V12H17.2031L16.6711 15.4688H13.875V23.8542C19.6118 22.954 24 17.9896 24 12Z" fill="#1877F2"/>
      <path d="M16.6711 15.4688L17.2031 12H13.875V9.74906C13.875 8.79994 14.3399 7.875 15.8306 7.875H17.3438V4.92188C17.3438 4.92188 15.9705 4.6875 14.6575 4.6875C11.9166 4.6875 10.125 6.34875 10.125 9.35625V12H7.07812V15.4688H10.125V23.8542C10.7453 23.9514 11.3722 24.0001 12 24C12.6278 24.0001 13.2547 23.9514 13.875 23.8542V15.4688H16.6711Z" fill="white"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="black"/>
      <mask id="mask0_62_205" style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="4" y="4" width="16" height="16">
        <path d="M4.80005 4.79999H19.2V19.2H4.80005V4.79999Z" fill="white"/>
      </mask>
      <g mask="url(#mask0_62_205)">
        <path d="M16.14 5.47473H18.3484L13.5244 11.0023L19.2 18.5252H14.7566L11.2739 13.9635L7.29331 18.5252H5.08291L10.2422 12.611L4.80005 5.47576H9.35662L12.4999 9.64456L16.14 5.47473ZM15.3635 17.2004H16.5875L8.68805 6.73062H7.37559L15.3635 17.2004Z" fill="white"/>
      </g>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="12" fill="#EBEBEB"/>
      <path d="M17.0588 16.6547C11.116 19.4813 7.42597 17.116 5.06346 15.6788C4.91721 15.5888 4.66971 15.7013 4.88346 15.9488C5.67378 16.9022 8.25003 19.2 11.6166 19.2C14.9832 19.2 16.9885 17.3635 17.2388 17.0428C17.4863 16.725 17.3091 16.5478 17.0588 16.6547ZM18.7266 15.7322C18.5663 15.5241 17.7563 15.4847 17.2444 15.5494C16.7325 15.6113 15.9647 15.9235 16.0322 16.1091C16.066 16.1794 16.1363 16.1485 16.4879 16.1175C16.8394 16.0838 17.8266 15.9572 18.0319 16.2272C18.2372 16.4972 17.7169 17.7853 17.6213 17.9935C17.5285 18.2016 17.655 18.255 17.8294 18.1172C18.001 17.9794 18.3075 17.6194 18.5157 17.1131C18.7238 16.6013 18.8475 15.8897 18.7266 15.7322Z" fill="#FF6200"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16.4514 13.7606C16.1027 13.2769 15.7343 12.8859 15.7343 11.9944V9.02438C15.7343 7.76718 15.8243 6.61406 14.8961 5.7478C14.1649 5.04749 12.9555 4.79999 12.0274 4.79999C10.2161 4.79999 8.19393 5.47499 7.76643 7.71656C7.72424 7.95562 7.8958 8.08219 8.05049 8.11594L9.89831 8.31281C10.0699 8.30437 10.1964 8.13562 10.2274 7.96406C10.3849 7.19062 11.0346 6.81937 11.7602 6.81937C12.1511 6.81937 12.5955 6.96281 12.8289 7.31437C13.0933 7.70531 13.0596 8.2425 13.0596 8.69531V8.94281C11.9542 9.06656 10.5114 9.14813 9.47643 9.60375C8.28393 10.1184 7.4458 11.1703 7.4458 12.7172C7.4458 14.6972 8.69455 15.6872 10.2977 15.6872C11.6561 15.6872 12.393 15.3666 13.4392 14.3006C13.788 14.8041 13.9005 15.046 14.5333 15.5719C14.6739 15.6478 14.8568 15.6394 14.9833 15.5269L14.9861 15.5325C15.3658 15.195 16.0577 14.5903 16.4458 14.2669C16.6005 14.1375 16.5752 13.9322 16.4514 13.7606ZM12.7052 12.9028C12.4014 13.44 11.9233 13.7691 11.3861 13.7691C10.6549 13.7691 10.2274 13.2122 10.2274 12.3881C10.2274 10.7653 11.6814 10.47 13.0596 10.47V10.8834H13.0624C13.0624 11.6259 13.0821 12.2447 12.7052 12.9028Z" fill="black"/>
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
    overflow: "hidden",
  },
};

export default function SelectProvider() {
  const { logos, enabled } = useLoaderData();
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
          {enabled.google && (
            <a href={socialUrl("google")} style={styles.iconButton} title="Continue with Google">
              {logos.google ? (
                <img src={logos.google} alt="Google" width="24" height="24" style={{ objectFit: "cover" }} />
              ) : (
                <GoogleIcon />
              )}
            </a>
          )}
          {enabled.linkedin && (
            <a href={socialUrl("linked")} style={styles.iconButton} title="Continue with LinkedIn">
              {logos.linkedin ? (
                <img src={logos.linkedin} alt="LinkedIn" width="24" height="24" style={{ objectFit: "cover" }} />
              ) : (
                <LinkedInIcon />
              )}
            </a>
          )}
          {enabled.facebook && (
            <a href={socialUrl("facebook")} style={styles.iconButton} title="Continue with Facebook">
              {logos.facebook ? (
                <img src={logos.facebook} alt="Facebook" width="24" height="24" style={{ objectFit: "cover" }} />
              ) : (
                <FacebookIcon />
              )}
            </a>
          )}
          {enabled.twitter && (
            <a href={socialUrl("twitter")} style={styles.iconButton} title="Continue with X">
              {logos.twitter ? (
                <img src={logos.twitter} alt="X" width="24" height="24" style={{ objectFit: "cover" }} />
              ) : (
                <XIcon />
              )}
            </a>
          )}
          {enabled.amazon && (
            <a href={socialUrl("amazon")} style={styles.iconButton} title="Continue with Amazon">
              {logos.amazon ? (
                <img src={logos.amazon} alt="Amazon" width="24" height="24" style={{ objectFit: "cover" }} />
              ) : (
                <AmazonIcon />
              )}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}