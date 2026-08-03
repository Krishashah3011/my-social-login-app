import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
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

  return { settings };
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();

  const updated = await db.shopSettings.update({
    where: { shop: session.shop },
    data: {
      googleEnabled: formData.get("googleEnabled") === "true",
      twitterEnabled: formData.get("twitterEnabled") === "true",
      facebookEnabled: formData.get("facebookEnabled") === "true",
      linkedinEnabled: formData.get("linkedinEnabled") === "true",
      amazonEnabled: formData.get("amazonEnabled") === "true",
    },
  });

  return { settings: updated };
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/>
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"/>
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#fff"/>
      <path fill="#0A66C2" d="M8.5 9.5h-2v7h2v-7zM7.5 8.6a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM17 12.6c0-2-1.1-2.9-2.5-2.9-1.1 0-1.6.6-1.9 1v-.9h-2v7h2v-3.9c0-.6.4-1.2 1.1-1.2s1.1.6 1.1 1.2v3.9h2v-4.2z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#fff"/>
      <path fill="#1877F2" d="M13.5 21v-7h2.3l.3-2.7h-2.6V9.5c0-.8.2-1.3 1.3-1.3h1.4V5.8c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.9H8.8v2.7h2.3v7h2.4z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#fff"/>
      <path fill="#000" d="M6.5 6.5l4.2 5.6-4.4 5.4h1.3l3.8-4.7 3.1 4.7h3l-4.5-6 4.1-5h-1.3l-3.5 4.3-2.8-4.3h-3z"/>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#fff"/>
      <path fill="#FF9900" d="M17.5 15.8c-1.8 1.3-4.3 2-6.5 2-3.1 0-5.9-1.1-8-3-.2-.2 0-.4.2-.3 2.3 1.3 5.1 2.1 8 2.1 2 0 4.1-.4 6.1-1.2.3-.1.5.2.2.4z"/>
      <path fill="#232F3E" d="M13 8.7v-.4c0-.2.1-.3.3-.3h2c.2 0 .3.1.3.3v.3c0 .2-.2.4-.4.7l-1 1.5c.4 0 .8.1 1.1.3.1 0 .1.1.1.2v.4c0 .1-.1.2-.3.2-.6-.3-1.4-.4-2 0-.1.1-.2 0-.2-.2v-.4c0-.1 0-.2.1-.3l1.2-1.7h-1c-.2 0-.3-.1-.3-.3z"/>
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
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    background: "#f2f2f2",
    cursor: "pointer",
    userSelect: "none",
  },
  sectionTitle: { fontWeight: 600, fontSize: "14px" },
  chevron: (open) => ({
    transform: open ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.2s ease",
    color: NAVY,
  }),
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 20px",
    borderTop: "1px solid #f0f0f0",
  },
  rowLeft: { display: "flex", alignItems: "center", gap: "14px" },
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
  providerName: { fontSize: "14px", fontWeight: 500 },
  providerSub: { fontSize: "12px", color: "#888" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 20px",
  },
  saveButton: (disabled) => ({
    padding: "10px 20px",
    background: disabled ? "#c9c9c9" : NAVY,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
  }),
};

function ChevronIcon({ open }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" style={styles.chevron(open)}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9l6 6 6-6"
      />
    </svg>
  );
}

function ProviderRow({ icon, name, subtitle, checked, onToggle, disabled }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <div style={styles.badge}>{icon}</div>
        <div>
          <div style={styles.providerName}>{name}</div>
          {subtitle && <div style={styles.providerSub}>{subtitle}</div>}
        </div>
      </div>
      <s-switch checked={checked} disabled={disabled} onChange={onToggle} />
    </div>
  );
}

export default function Settings() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [values, setValues] = useState({
    googleEnabled: settings.googleEnabled,
    twitterEnabled: settings.twitterEnabled,
    facebookEnabled: settings.facebookEnabled,
    linkedinEnabled: settings.linkedinEnabled,
    amazonEnabled: settings.amazonEnabled,
  });
  const [sectionOpen, setSectionOpen] = useState(true);

  const isDirty = Object.keys(values).some(
    (key) => values[key] !== settings[key],
  );
  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.settings) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data, shopify]);

  const toggle = (field) => {
    setValues((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => {
      formData.set(key, String(val));
    });
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page heading="Settings">
      <TopIconNav active="settings" />

      <div style={styles.card}>
        <div
          style={styles.sectionHeader}
          onClick={() => setSectionOpen((o) => !o)}
        >
          <span style={styles.sectionTitle}>Login Providers</span>
          <ChevronIcon open={sectionOpen} />
        </div>

        {sectionOpen && (
          <>
            <ProviderRow
              icon={<GoogleIcon />}
              name="Google"
              subtitle="Continue with Google"
              checked={values.googleEnabled}
              onToggle={() => toggle("googleEnabled")}
            />
            <ProviderRow
              icon={<LinkedInIcon />}
              name="LinkedIn"
              subtitle="Continue with LinkedIn"
              checked={values.linkedinEnabled}
              onToggle={() => toggle("linkedinEnabled")}
            />
            <ProviderRow
              icon={<FacebookIcon />}
              name="Facebook"
              subtitle="Continue with Facebook"
              checked={values.facebookEnabled}
              onToggle={() => toggle("facebookEnabled")}
            />
            <ProviderRow
              icon={<XIcon />}
              name="X (Twitter)"
              subtitle="Continue with X"
              checked={values.twitterEnabled}
              onToggle={() => toggle("twitterEnabled")}
            />
            <ProviderRow
              icon={<AmazonIcon />}
              name="Amazon"
              subtitle="Continue with Amazon"
              checked={values.amazonEnabled}
              onToggle={() => toggle("amazonEnabled")}
            />
          </>
        )}

        <div style={styles.footer}>
          <button
            style={styles.saveButton(!isDirty || isSaving)}
            disabled={!isDirty || isSaving}
            onClick={handleSave}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};