import { useState } from "react";
import { Link } from "react-router";

const GREENML = "#96BF47";
const BORDERML = "#E5E5E5";
const TEXT_BLACKML = "#000000";
const TEXT_MUTEDML = "#616161";

const InfoIconML = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="#fff" strokeWidth="1.4" />
    <rect x="7.25" y="6.6" width="1.5" height="5.4" rx="0.6" fill="#fff" />
    <circle cx="8" cy="4.4" r="0.95" fill="#fff" />
  </svg>
);

const ChevronIconML = ({ openML }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      transform: openML ? "rotate(0deg)" : "rotate(180deg)",
      transition: "transform 0.2s ease",
    }}
  >
    <path
      d="M3.5 10L8 5.5L12.5 10"
      stroke={TEXT_BLACKML}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIconML = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.5 7.2L5.4 10L11.5 3.8"
      stroke="#1F7A3F"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIconML = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 2.5L9 7L4 11.5"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const stylesML = {
  card: {
    background: "#FFFFFF",
    border: `1px solid ${BORDERML}`,
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "16px",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconBox: {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    borderRadius: "8px",
    background: GREENML,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "16px",
    lineHeight: "20px",
    color: TEXT_BLACKML,
    margin: 0,
  },
  chevronButton: {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    border: "none",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
  },
  body: {
    marginTop: "16px",
  },
  intro: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 400,
    fontSize: "13px",
    lineHeight: "18px",
    color: TEXT_MUTEDML,
    margin: "0 0 20px",
  },
  stepTitle: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "18px",
    color: TEXT_BLACKML,
    margin: "0 0 6px",
  },
  stepDescription: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 400,
    fontSize: "13px",
    lineHeight: "19px",
    color: TEXT_MUTEDML,
    margin: "0 0 14px",
    maxWidth: "620px",
  },
  stepButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    background: "#000000",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "13px",
    lineHeight: "16px",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  stepDivider: {
    border: "none",
    borderTop: `1px solid ${BORDERML}`,
    margin: "18px 0",
  },
  donePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 14px",
    background: "#E3F4E9",
    borderRadius: "8px",
    color: "#1F7A3F",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "13px",
  },
};

export default function GetStartedGuide({
  appName: appNameML,
  embedDeepLink: embedDeepLinkML,
  registered: registeredML = false,
}) {
  const [openML, setOpenML] = useState(true);

  return (
    <div style={stylesML.card}>
      <div style={stylesML.headerRow}>
        <div style={stylesML.iconBox}>
          <InfoIconML />
        </div>

        <h2 style={stylesML.title}>
          User Guide: Get Started with {appNameML}
        </h2>

        <button
          type="button"
          style={stylesML.chevronButton}
          onClick={() => setOpenML(!openML)}
          aria-label={openML ? "Collapse guide" : "Expand guide"}
        >
          <ChevronIconML openML={openML} />
        </button>
      </div>

      {openML && (
        <div style={stylesML.body}>
          <p style={stylesML.intro}>
            Follow this step to set up {appNameML}, allowing your
            customers to sign in with their social accounts.
          </p>

          <div>
            <p style={stylesML.stepTitle}>1. Enable Social Login App Embed</p>

            <p style={stylesML.stepDescription}>
              The app must be enabled in your theme's "App embeds" section to
              function. Click the button below to jump directly to the toggle
              in your Shopify Theme Editor.
            </p>

            <a
              href={embedDeepLinkML}
              target="_blank"
              rel="noreferrer"
              style={stylesML.stepButton}
            >
              Activate App Embed
              <ArrowRightIconML />
            </a>
          </div>

          <hr style={stylesML.stepDivider} />

          <div>
            <p style={stylesML.stepTitle}>2. Enable App Status</p>

            <p style={stylesML.stepDescription}>
              Visit Settings to make sure the app status is turned on and
              choose which social login providers are enabled.
            </p>

            <Link to="/app/settings" style={stylesML.stepButton}>
              Go to Settings
              <ArrowRightIconML />
            </Link>
          </div>

          <hr style={stylesML.stepDivider} />

          <div>
            <p style={stylesML.stepTitle}>3. Customize App Icons</p>

            <p style={stylesML.stepDescription}>
              In Settings, upload custom icons for each provider to replace
              the default icons and match your store's branding.
            </p>

            <Link to="/app/settings" style={stylesML.stepButton}>
              Go to Settings
              <ArrowRightIconML />
            </Link>
          </div>

          <hr style={stylesML.stepDivider} />

          <div>
            <p style={stylesML.stepTitle}>4. Create Your Account</p>

            <p style={stylesML.stepDescription}>
              Register your username and email so you can manage this app
              and unlock the Settings page.
            </p>

            {registeredML ? (
              <span style={stylesML.donePill}>
                <CheckIconML />
                Completed
              </span>
            ) : (
              <Link to="/app/account" style={stylesML.stepButton}>
                Go to Account
                <ArrowRightIconML />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}