import { useState } from "react";
import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  let settings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await db.shopSettings.create({
      data: { shop: session.shop },
    });
  }

  const providerList = [
    { key: "googleEnabled", label: "Google" },
    { key: "linkedinEnabled", label: "LinkedIn" },
    { key: "facebookEnabled", label: "Facebook" },
    { key: "twitterEnabled", label: "X (Twitter)" },
    { key: "amazonEnabled", label: "Amazon" },
  ];

  const totalProviders = providerList.length;
  const enabledCount = providerList.filter((p) => settings[p.key]).length;
  const allProvidersEnabled = enabledCount === totalProviders;

  // Progress bar reflects actual proportion of enabled providers —
  // disabling one brings this back down, enabling one brings it up.
  const percentComplete = Math.round((enabledCount / totalProviders) * 100);

  const steps = [
    {
      id: "providers",
      title: "Enable a Login Provider",
      description:
        "Turn on at least one social login provider (Facebook, Linkedin, Google, X or Amazon) in settings.",
      done: allProvidersEnabled,
      actionLabel: allProvidersEnabled ? "Completed" : "Complete",
      actionHref: "/app/settings",
    },
  ];

  return { settings, steps, percentComplete };
};

// ---- design tokens pulled directly from the Figma CSS export ----
const BLUE = "#073E74";
const GREEN = "#96BF47";
const BORDER = "#E5E5E5";
const DIVIDER = "#DBDBDB";
const ALERT_BG = "#D8ECFF";
const TEXT_BLACK = "#000000";
const TEXT_GUIDE = "#424242";
const TEXT_MUTED = "#373737";

function InfoBadgeIcon() {
  return (
    <div
      style={{
        width: "24px",
        height: "24px",
        background: GREEN,
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="7" height="14" viewBox="0 0 7 14" fill="none">
        <rect x="2.2" y="4.5" width="2.6" height="9" rx="1.3" fill="#fff" />
        <circle cx="3.5" cy="1.6" r="1.6" fill="#fff" />
      </svg>
    </div>
  );
}

function Chevron({ open }) {
  return (
    <svg
      width="16"
      height="8.53"
      viewBox="0 0 16 9"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M1 1L8 8L15 1"
        stroke={BLUE}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: "1px" }}>
      <circle cx="8" cy="8" r="7" stroke={BLUE} strokeWidth="1.4" />
      <rect x="7.25" y="7" width="1.5" height="4.8" rx="0.75" fill={BLUE} />
      <circle cx="8" cy="4.6" r="0.95" fill={BLUE} />
    </svg>
  );
}

const styles = {
  hero: {
    width: "100%",
    minHeight: "180px",
    borderRadius: "20px",
    background:
      "linear-gradient(92.71deg, #003456 0.09%, #004868 99.91%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "24px 20px",
    marginBottom: "16px",
    textAlign: "center",
  },
  heroTitle: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 800,
    fontSize: "28px",
    lineHeight: "34px",
    color: "#FFFFFF",
    margin: 0,
  },
  heroSubtitle: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "18px",
    lineHeight: "22px",
    color: "#FFFFFF",
    margin: 0,
  },
  card: {
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "16px",
  },
  guideHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  guideHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  guideText: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    lineHeight: "19px",
    letterSpacing: "0.02em",
    color: TEXT_GUIDE,
  },
  alertBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    background: ALERT_BG,
    borderRadius: "10px",
    gap: "16px",
    flexWrap: "wrap",
  },
  alertLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
  alertTitle: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "16px",
    lineHeight: "19px",
    color: BLUE,
    margin: 0,
  },
  alertBody: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 400,
    fontSize: "14px",
    lineHeight: "17px",
    color: BLUE,
    margin: 0,
  },
  alertButton: {
    padding: "10px",
    background: BLUE,
    borderRadius: "10px",
    color: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "17px",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  sectionHeading: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "18px",
    lineHeight: "22px",
    letterSpacing: "0.02em",
    color: TEXT_BLACK,
    margin: 0,
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${DIVIDER}`,
    margin: 0,
    width: "100%",
  },
  progressLabel: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "17px",
    color: TEXT_BLACK,
    marginBottom: "4px",
  },
  progressTrack: {
    width: "100%",
    height: "6px",
    borderRadius: "100px",
    background: DIVIDER,
    overflow: "hidden",
  },
  progressFill: (percent) => ({
    width: `${percent}%`,
    height: "100%",
    borderRadius: "100px",
    background: BLUE,
    transition: "width 0.3s ease",
  }),
  stepRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  stepTitle: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "17px",
    color: TEXT_BLACK,
    margin: 0,
  },
  stepDescription: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 400,
    fontSize: "12px",
    lineHeight: "15px",
    color: TEXT_MUTED,
    margin: "4px 0 0",
    maxWidth: "606px",
  },
  stepButton: {
    padding: "10px",
    background: BLUE,
    borderRadius: "10px",
    color: "#FFFFFF",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "17px",
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  stepDonePill: {
    padding: "8px 14px",
    background: "#E3F4E9",
    borderRadius: "10px",
    color: "#1F7A3F",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "14px",
  },
};

export default function Index() {
  const { steps, percentComplete } = useLoaderData();
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <s-page heading="Social Login App">
      <TopIconNav active="home" />

      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Welcome to Social Login App!</h1>
        <p style={styles.heroSubtitle}>Simplify Customer Login with My Social Login App!</p>
      </div>

      {/* User Guide + Action Required card */}
      <div style={styles.card}>
        <div style={styles.guideHeaderRow} onClick={() => setGuideOpen((o) => !o)}>
          <div style={styles.guideHeaderLeft}>
            <InfoBadgeIcon />
            <span style={styles.guideText}>
              User Guide: Get Started with Social Login App
            </span>
          </div>
          <Chevron open={guideOpen} />
        </div>

        {guideOpen && (
          <div style={styles.alertBox}>
            <div style={styles.alertLeft}>
              <AlertIcon />
              <div>
                <p style={styles.alertTitle}>
                  Action Required: Review blocks are missing from your product page.
                </p>
                <p style={styles.alertBody}>Please add them by clicking the button.</p>
              </div>
            </div>
            <button style={styles.alertButton}>Add Review Slider Block</button>
          </div>
        )}
      </div>

      {/* Setup Progress card */}
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>Your Setup Progress</h2>
        <hr style={styles.divider} />
        <div>
          <div style={styles.progressLabel}>{percentComplete}% Complete</div>
          <div style={styles.progressTrack}>
            <div style={styles.progressFill(percentComplete)} />
          </div>
        </div>
      </div>

      {/* Required Setup Steps card */}
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>Required Setup Steps</h2>
        <hr style={styles.divider} />
        {steps.map((step) => (
          <div key={step.id} style={styles.stepRow}>
            <div>
              <p style={styles.stepTitle}>{step.title}</p>
              <p style={styles.stepDescription}>{step.description}</p>
            </div>
            {step.done ? (
              <span style={styles.stepDonePill}>{step.actionLabel}</span>
            ) : (
              <Link to={step.actionHref} style={{ textDecoration: "none" }}>
                <button style={styles.stepButton}>{step.actionLabel}</button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};