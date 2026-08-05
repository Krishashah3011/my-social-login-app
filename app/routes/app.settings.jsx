import { useState, useEffect } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";

// ---- design tokens pulled directly from the Figma CSS export ----
const BLUE = "#073E74";
const GRAY_OFF = "#707072";
const BORDER = "#DBDBDB";
const LICENSE_BG = "#EDEDED";
const LICENSE_BORDER = "#E9E9EA";
const TEXT_DARK = "#000000";
const TEXT_MUTED = "#373737";

function generateSerialKey() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SER-${Date.now()}-${rand}`;
}

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);

  let settings = await db.shopSettings.findUnique({
    where: { shop: session.shop },
  });

  if (!settings) {
    settings = await db.shopSettings.create({
      data: { shop: session.shop, serialKey: generateSerialKey() },
    });
  } else if (!settings.serialKey) {
    // backfill for existing shops — remove if you don't add the column
    settings = await db.shopSettings.update({
      where: { shop: session.shop },
      data: { serialKey: generateSerialKey() },
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
      appEnabled: formData.get("appEnabled") === "true",
      googleEnabled: formData.get("googleEnabled") === "true",
      twitterEnabled: formData.get("twitterEnabled") === "true",
      facebookEnabled: formData.get("facebookEnabled") === "true",
      linkedinEnabled: formData.get("linkedinEnabled") === "true",
      amazonEnabled: formData.get("amazonEnabled") === "true",
    },
  });

  return { settings: updated };
};

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke={BLUE} strokeWidth="1.2" />
      <rect x="7.3" y="6.5" width="1.4" height="4.5" rx="0.7" fill={BLUE} />
      <circle cx="8" cy="4.6" r="0.9" fill={BLUE} />
    </svg>
  );
}

function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      style={{
        width: "46px",
        height: "24px",
        borderRadius: "110px",
        border: "none",
        padding: 0,
        position: "relative",
        background: checked ? BLUE : GRAY_OFF,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 0.15s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3.5px",
          left: checked ? "25px" : "4px",
          width: "17px",
          height: "17px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.15s ease",
        }}
      />
    </button>
  );
}

const styles = {
  outerCard: {
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    background: "#fff",
    padding: "16px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  heading: {
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "18px",
    letterSpacing: "0.02em",
    color: TEXT_DARK,
    margin: 0,
  },
  subtitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "3px",
  },
  subtitleText: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    color: TEXT_DARK,
  },
  innerCard: {
    border: `1px solid ${BORDER}`,
    borderRadius: "8px",
    background: "#fff",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  licenseBox: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "10px",
    background: LICENSE_BG,
    border: `1px solid ${LICENSE_BORDER}`,
    borderRadius: "4px",
  },
  licenseTitle: {
    fontFamily: "Inter, sans-serif",
    fontSize: "16px",
    fontWeight: 500,
    color: TEXT_DARK,
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${BORDER}`,
    margin: 0,
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    color: TEXT_DARK,
  },
  subLabel: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    color: TEXT_MUTED,
    //maxWidth: "570px",
    marginTop: "4px",
  },
  serialPill: {
    padding: "4px 10px",
    background: "#000000",
    borderRadius: "4px",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
  },
  providersBox: {
    background: "#fff",
    border: `1px solid ${BORDER}`,
    borderRadius: "4px",
    padding: "10px 10px 13px",
  },
  providerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 10px",
  },
};

function saveWrapperStyle(disabled) {
  return {
    display: "inline-flex",
    padding: "2px",
    borderRadius: "8px",
    background: disabled
      ? "linear-gradient(180deg, #9a9a9a 0%, #6f6f6f 100%)"
      : "linear-gradient(180deg, #2A2A2A 0%, #000000 100%)",
  };
}

function saveButtonStyle(disabled) {
  return {
    padding: "8px 24px",
    borderRadius: "6px",
    border: `1px solid ${disabled ? "#7a7a7a" : "#353535"}`,
    background: disabled
      ? "linear-gradient(180deg, #a8a8a8 0%, #7d7d7d 100%)"
      : "linear-gradient(180deg, #1C1C1C 0%, #404040 100%)",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontWeight: 600,
    fontSize: "16px",
    cursor: disabled ? "default" : "pointer",
  };
}

function ProviderRow({ name, subtitle, checked, onToggle, disabled }) {
  return (
    <div style={styles.providerRow}>
      <div>
        <div style={styles.label}>{name}</div>
        {subtitle && <div style={{ ...styles.subLabel, marginTop: "2px" }}>{subtitle}</div>}
      </div>
      <ToggleSwitch checked={checked} onChange={onToggle} disabled={disabled} />
    </div>
  );
}

export default function Settings() {
  const { settings } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [values, setValues] = useState({
    appEnabled: settings.appEnabled,
    googleEnabled: settings.googleEnabled,
    twitterEnabled: settings.twitterEnabled,
    facebookEnabled: settings.facebookEnabled,
    linkedinEnabled: settings.linkedinEnabled,
    amazonEnabled: settings.amazonEnabled,
  });

  const isDirty = Object.keys(values).some((key) => values[key] !== settings[key]);
  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.settings) {
      shopify.toast.show("Settings saved");
    }
  }, [fetcher.data, shopify]);

  const toggle = (field) => {
    setValues((prev) => {
      // Master Status toggle
      if (field === "appEnabled") {
        const newStatus = !prev.appEnabled;

        // Turning OFF -> turn everything OFF
        if (!newStatus) {
          return {
            appEnabled: false,
            googleEnabled: false,
            twitterEnabled: false,
            facebookEnabled: false,
            linkedinEnabled: false,
            amazonEnabled: false,
          };
        }

        // Turning ON -> only enable the app.
        // Providers stay OFF until you enable them manually.
        return {
          ...prev,
          appEnabled: true,
        };
      }

      // Individual provider toggle
      return {
        ...prev,
        [field]: !prev[field],
      };
    });
  };

  const handleSave = () => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => formData.set(key, String(val)));
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <s-page>
      <TopIconNav active="settings" />

      <div style={styles.outerCard}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.heading}>Configurations</h1>
          </div>
          <div style={saveWrapperStyle(!isDirty || isSaving)}>
            <button
              style={saveButtonStyle(!isDirty || isSaving)}
              disabled={!isDirty || isSaving}
              onClick={handleSave}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        <div style={styles.innerCard}>
          {/* License and Status */}
          <div style={styles.licenseBox}>
            <div style={styles.licenseTitle}>License and Status</div>
            <hr style={styles.divider} />

            <div style={styles.rowBetween}>
              <div style={styles.label}>Serial Key</div>
              <div style={styles.serialPill}>{settings.serialKey}</div>
            </div>
            <hr style={styles.divider} />

            <div style={styles.rowBetween}>
              <div>
                <div style={styles.label}>Status</div>
                <div style={styles.subLabel}>
                  Enable or disable the app globally. When disabled, no recommendations will be
                  shown on your store.
                </div>
              </div>
              <ToggleSwitch
                checked={values.appEnabled}
                onChange={() => toggle("appEnabled")}
              />
            </div>
          </div>

          {/* Login providers */}
          <div style={styles.providersBox}>
            <ProviderRow
              name="Google"
              subtitle="Continue with Google"
              checked={values.googleEnabled}
              onToggle={() => toggle("googleEnabled")}
            />
            <hr style={styles.divider} />
            <ProviderRow
              name="Linkedin"
              subtitle="Continue with Linkedin"
              checked={values.linkedinEnabled}
              onToggle={() => toggle("linkedinEnabled")}
            />
            <hr style={styles.divider} />
            <ProviderRow
              name="Facebook"
              subtitle="Continue with Facebook"
              checked={values.facebookEnabled}
              onToggle={() => toggle("facebookEnabled")}
            />
            <hr style={styles.divider} />
            <ProviderRow
              name="X (Twitter)"
              subtitle="Continue with Twitter"
              checked={values.twitterEnabled}
              onToggle={() => toggle("twitterEnabled")}
            />
            <hr style={styles.divider} />
            <ProviderRow
              name="Amazon"
              subtitle="Continue with Amazon"
              checked={values.amazonEnabled}
              onToggle={() => toggle("amazonEnabled")}
            />
          </div>
        </div>
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};