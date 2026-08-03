import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  let settings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await db.shopSettings.create({
      data: { shop: session.shop },
    });
  }

  let shopEmail = null;
  try {
    const response = await admin.graphql(
      `#graphql
        query {
          shop {
            email
            name
          }
        }`,
    );
    const data = await response.json();
    shopEmail = data?.data?.shop?.email || null;
  } catch (err) {
    console.error("SHOP QUERY ERROR:", err);
  }

  const providerList = [
    { key: "googleEnabled", label: "Google" },
    { key: "linkedinEnabled", label: "LinkedIn" },
    { key: "facebookEnabled", label: "Facebook" },
    { key: "twitterEnabled", label: "X (Twitter)" },
    { key: "amazonEnabled", label: "Amazon" },
  ];

  const enabledCount = providerList.filter((p) => settings[p.key]).length;

  return {
    shop: session.shop,
    shopEmail,
    settings,
    providerList,
    enabledCount,
  };
};

function HomeGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M4 10.5L12 4L20 10.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V10.5Z"
      />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M4 6h16v12H4z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
        d="M4 7l8 6 8-6"
      />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12l5 5 9-10"
      />
    </svg>
  );
}

const NAVY = "#1a2b4c";

const styles = {
  card: {
    border: "1px solid #e1e1e1",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff",
    marginBottom: "16px",
  },
  cardHeader: {
    padding: "14px 20px",
    background: "#f2f2f2",
    fontWeight: 600,
    fontSize: "14px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px 20px",
    borderTop: "1px solid #f0f0f0",
  },
  badge: {
    width: "36px",
    height: "36px",
    minWidth: "36px",
    borderRadius: "8px",
    background: NAVY,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fieldLabel: { fontSize: "12px", color: "#888" },
  fieldValue: { fontSize: "14px", fontWeight: 500, wordBreak: "break-all" },
  summaryRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderTop: "1px solid #f0f0f0",
  },
  pill: (enabled) => ({
    fontSize: "12px",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "999px",
    background: enabled ? "#e3f4e9" : "#fdecea",
    color: enabled ? "#1f7a3f" : "#c0392b",
  }),
};

function InfoRow({ icon, label, value }) {
  return (
    <div style={styles.row}>
      <div style={styles.badge}>{icon}</div>
      <div>
        <div style={styles.fieldLabel}>{label}</div>
        <div style={styles.fieldValue}>{value || "—"}</div>
      </div>
    </div>
  );
}

export default function Account() {
  const { shop, shopEmail, settings, providerList, enabledCount } =
    useLoaderData();

  return (
    <s-page heading="Account">
      <TopIconNav active="account" />

      <div style={styles.card}>
        <div style={styles.cardHeader}>Store</div>
        <InfoRow icon={<HomeGlyph />} label="Shop URL" value={shop} />
        <InfoRow icon={<MailGlyph />} label="Shop Contact Email" value={shopEmail} />
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          Login Providers — {enabledCount} of {providerList.length} enabled
        </div>
        {providerList.map((p) => (
          <div key={p.key} style={styles.summaryRow}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={styles.badge}>
                <CheckGlyph />
              </div>
              <span style={{ fontSize: "14px" }}>{p.label}</span>
            </div>
            <span style={styles.pill(settings[p.key])}>
              {settings[p.key] ? "Enabled" : "Disabled"}
            </span>
          </div>
        ))}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f0f0" }}>
          <a href="/app/settings" style={{ fontSize: "13px" }}>
            Manage in Settings
          </a>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};