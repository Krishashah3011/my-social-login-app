import { useState, useEffect, useRef } from "react";
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

// ---- default provider icon previews (small, for settings thumbnails) ----
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/>
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"/>
      <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"/>
      <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.7l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/>
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#0A66C2"/>
      <path fill="#fff" d="M8.5 9.5h-2v7h2v-7zM7.5 8.6a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM17 12.6c0-2-1.1-2.9-2.5-2.9-1.1 0-1.6.6-1.9 1v-.9h-2v7h2v-3.9c0-.6.4-1.2 1.1-1.2s1.1.6 1.1 1.2v3.9h2v-4.2z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#1877F2"/>
      <path fill="#fff" d="M13.5 21v-7h2.3l.3-2.7h-2.6V9.5c0-.8.2-1.3 1.3-1.3h1.4V5.8c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.1-3.2 3.3v1.9H8.8v2.7h2.3v7h2.4z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#000"/>
      <path fill="#fff" d="M6.5 6.5l4.2 5.6-4.4 5.4h1.3l3.8-4.7 3.1 4.7h3l-4.5-6 4.1-5h-1.3l-3.5 4.3-2.8-4.3h-3z"/>
    </svg>
  );
}

function AmazonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill="#000"/>
      <path fill="#FF9900" d="M17.5 15.8c-1.8 1.3-4.3 2-6.5 2-3.1 0-5.9-1.1-8-3-.2-.2 0-.4.2-.3 2.3 1.3 5.1 2.1 8 2.1 2 0 4.1-.4 6.1-1.2.3-.1.5.2.2.4z"/>
      <path fill="#FF9900" d="M18.3 14.9c-.2-.3-1.5-.1-2.1-.1-.2 0-.2-.2-.1-.3 1-.7 2.6-.5 2.8-.3.2.3-.1 1.8-1 2.6-.1.1-.3 0-.2-.1.3-.5.7-1.5.6-1.8z"/>
      <path fill="#fff" d="M13 8.7v-.4c0-.2.1-.3.3-.3h2c.2 0 .3.1.3.3v.3c0 .2-.2.4-.4.7l-1 1.5c.4 0 .8.1 1.1.3.1 0 .1.1.1.2v.4c0 .1-.1.2-.3.2-.6-.3-1.4-.4-2 0-.1.1-.2 0-.2-.2v-.4c0-.1 0-.2.1-.3l1.2-1.7h-1c-.2 0-.3-.1-.3-.3z"/>
      <path fill="#fff" d="M8.7 12h-.6c-.1 0-.2-.1-.2-.2V8.5c0-.1.1-.2.2-.2h.6c.1 0 .2.1.2.2v.4c.3-.4.6-.6 1.1-.6.5 0 .8.2.9.7.3-.5.7-.7 1.2-.7.4 0 .7.1.9.4.3.3.2.7.2 1.1v2.1c0 .1-.1.2-.2.2h-.6c-.1 0-.2-.1-.2-.2V10c0-.2 0-.7-.5-.7-.4 0-.6.4-.6.7v1.8c0 .1-.1.2-.2.2h-.6c-.1 0-.2-.1-.2-.2V10c0-.2 0-.7-.5-.7s-.6.4-.6.7v1.8c0 .1-.1.2-.2.2z"/>
    </svg>
  );
}

const DEFAULT_ICONS = {
  google: GoogleIcon,
  linkedin: LinkedInIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  amazon: AmazonIcon,
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
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "0 10px 12px",
  },
  logoPreview: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: `1px solid ${BORDER}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
    background: "#fff",
  },
  logoPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  logoUploadLabel: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 500,
    color: BLUE,
    cursor: "pointer",
    textDecoration: "underline",
  },
  logoUploadLabelDisabled: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 500,
    color: GRAY_OFF,
    cursor: "default",
    textDecoration: "none",
  },
  logoResetLabel: {
    fontFamily: "Inter, sans-serif",
    fontSize: "12px",
    fontWeight: 400,
    color: TEXT_MUTED,
    cursor: "pointer",
    textDecoration: "underline",
  },
  logoHint: {
    fontFamily: "Inter, sans-serif",
    fontSize: "11px",
    color: TEXT_MUTED,
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

function LogoUploader({ providerKey, logoUrl, enabled, shop }) {
  const fileInputRef = useRef(null);
  const uploadFetcher = useFetcher();
  const resetFetcher = useFetcher();
  const DefaultIcon = DEFAULT_ICONS[providerKey];

  const isUploading = uploadFetcher.state !== "idle";
  const isResetting = resetFetcher.state !== "idle";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("provider", providerKey);
    formData.set("file", file);

    uploadFetcher.submit(formData, {
      method: "POST",
      action: "/app/settings/upload-logo",
      encType: "multipart/form-data",
    });

    e.target.value = "";
  };

  const handleReset = () => {
    const formData = new FormData();
    formData.set("provider", providerKey);
    formData.set("intent", "reset");

    resetFetcher.submit(formData, {
      method: "POST",
      action: "/app/settings/upload-logo",
    });
  };

  return (
    <div style={styles.logoRow}>
      <div style={styles.logoPreview}>
        {logoUrl ? (
          <img src={logoUrl} alt={`${providerKey} logo`} style={styles.logoPreviewImg} />
        ) : (
          <DefaultIcon />
        )}
      </div>

      {enabled ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <label style={styles.logoUploadLabel}>
              {isUploading ? "Uploading..." : "Upload new logo"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileChange}
                disabled={isUploading}
                style={{ display: "none" }}
              />
            </label>
            {logoUrl && (
              <span style={styles.logoResetLabel} onClick={isResetting ? undefined : handleReset}>
                {isResetting ? "Resetting..." : "Reset to default"}
              </span>
            )}
          </div>
          <span style={styles.logoHint}>PNG, JPG or SVG</span>
        </div>
      ) : (
        <span style={styles.logoUploadLabelDisabled}>
          Enable this provider to customize its logo
        </span>
      )}
    </div>
  );
}

function ProviderRow({ providerKey, name, subtitle, checked, onToggle, logoUrl }) {
  return (
    <>
      <div style={styles.providerRow}>
        <div>
          <div style={styles.label}>{name}</div>
          {subtitle && <div style={{ ...styles.subLabel, marginTop: "2px" }}>{subtitle}</div>}
        </div>
        <ToggleSwitch checked={checked} onChange={onToggle} />
      </div>
      <LogoUploader providerKey={providerKey} logoUrl={logoUrl} enabled={checked} />
    </>
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
      if (field === "appEnabled") {
        const newStatus = !prev.appEnabled;
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
        return { ...prev, appEnabled: true };
      }
      return { ...prev, [field]: !prev[field] };
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
              <ToggleSwitch checked={values.appEnabled} onChange={() => toggle("appEnabled")} />
            </div>
          </div>

          <div style={styles.providersBox}>
            <ProviderRow
              providerKey="google"
              name="Google"
              subtitle="Continue with Google"
              checked={values.googleEnabled}
              onToggle={() => toggle("googleEnabled")}
              logoUrl={settings.googleLogo}
            />
            <hr style={styles.divider} />
            <ProviderRow
              providerKey="linkedin"
              name="Linkedin"
              subtitle="Continue with Linkedin"
              checked={values.linkedinEnabled}
              onToggle={() => toggle("linkedinEnabled")}
              logoUrl={settings.linkedinLogo}
            />
            <hr style={styles.divider} />
            <ProviderRow
              providerKey="facebook"
              name="Facebook"
              subtitle="Continue with Facebook"
              checked={values.facebookEnabled}
              onToggle={() => toggle("facebookEnabled")}
              logoUrl={settings.facebookLogo}
            />
            <hr style={styles.divider} />
            <ProviderRow
              providerKey="twitter"
              name="X (Twitter)"
              subtitle="Continue with Twitter"
              checked={values.twitterEnabled}
              onToggle={() => toggle("twitterEnabled")}
              logoUrl={settings.twitterLogo}
            />
            <hr style={styles.divider} />
            <ProviderRow
              providerKey="amazon"
              name="Amazon"
              subtitle="Continue with Amazon"
              checked={values.amazonEnabled}
              onToggle={() => toggle("amazonEnabled")}
              logoUrl={settings.amazonLogo}
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