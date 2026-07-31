import { Link } from "react-router";

const HomeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 10.5L12 4L20 10.5V19a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V10.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M19.4 13a7.4 7.4 0 0 0 0-2l2-1.5-2-3.4-2.4.6a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.3 2.7a7.6 7.6 0 0 0-1.7 1l-2.4-.6-2 3.4L6.6 11a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6a7.6 7.6 0 0 0 1.7 1L11 21h4l.3-2.7a7.6 7.6 0 0 0 1.7-1l2.4.6 2-3.4-2-1.5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

const AccountIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    <path
      d="M4.5 20a7.5 7.5 0 0 1 15 0"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

const iconButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid var(--s-color-border, #d1d1d1)",
  color: "inherit",
  textDecoration: "none",
};

export default function TopIconNav({ active }) {
  const activeStyle = {
    ...iconButtonStyle,
    background: "var(--s-color-bg-surface-selected, #eef4ff)",
    borderColor: "var(--s-color-border-emphasis, #4d7cfe)",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <Link
          to="/app"
          style={active === "home" ? activeStyle : iconButtonStyle}
          title="Home"
        >
          <HomeIcon />
        </Link>
        <Link
          to="/app/settings"
          style={active === "settings" ? activeStyle : iconButtonStyle}
          title="Settings"
        >
          <SettingsIcon />
        </Link>
      </div>

      <Link
        to="/app/account"
        style={active === "account" ? activeStyle : iconButtonStyle}
        title="Account"
      >
        <AccountIcon />
      </Link>
    </div>
  );
}