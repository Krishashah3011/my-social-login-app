import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

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

  const enabledCount = providerList.filter((p) => settings[p.key]).length;
  const anyProviderEnabled = enabledCount > 0;

  const steps = [
    {
      id: "providers",
      title: "Enable a Login Provider",
      description:
        "Turn on at least one social login provider (Google, LinkedIn, Facebook, X, or Amazon) in Settings.",
      done: anyProviderEnabled,
      actionLabel: "Configure Providers",
      actionHref: "/app/settings",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percentComplete = Math.round((completedCount / steps.length) * 100);

  // --- Analytics: totals per provider ---
  const [
    googleUsers,
    linkedUsers,
    facebookUsers,
    twitterUsers,
    amazonUsers,
    emailVerified,
  ] = await Promise.all([
    db.googleUser.findMany({ select: { createdAt: true } }),
    db.linkedUser.findMany({ select: { createdAt: true } }),
    db.facebookUser.findMany({ select: { createdAt: true } }),
    db.twitterUser.findMany({ select: { createdAt: true } }),
    db.amazonUser.findMany({ select: { createdAt: true } }),
    db.emailOtp.findMany({
      where: { consumed: true },
      select: { createdAt: true },
    }),
  ]);

  const totalsByProvider = [
    { name: "Google", count: googleUsers.length, color: "#4285F4" },
    { name: "LinkedIn", count: linkedUsers.length, color: "#0A66C2" },
    { name: "Facebook", count: facebookUsers.length, color: "#1877F2" },
    { name: "X", count: twitterUsers.length, color: "#000000" },
    { name: "Amazon", count: amazonUsers.length, color: "#FF9900" },
    { name: "Email", count: emailVerified.length, color: "#1a2b4c" },
  ];

  const totalLogins = totalsByProvider.reduce((sum, p) => sum + p.count, 0);

  // --- Analytics: last 7 days trend ---
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10)); // "YYYY-MM-DD"
  }

  const dayLabel = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const countByDay = (records) => {
    const map = {};
    for (const day of days) map[day] = 0;
    for (const r of records) {
      const day = r.createdAt.toISOString().slice(0, 10);
      if (day in map) map[day] += 1;
    }
    return map;
  };

  const googleByDay = countByDay(googleUsers);
  const linkedByDay = countByDay(linkedUsers);
  const facebookByDay = countByDay(facebookUsers);
  const twitterByDay = countByDay(twitterUsers);
  const amazonByDay = countByDay(amazonUsers);
  const emailByDay = countByDay(emailVerified);

  const trend = days.map((day) => ({
    date: dayLabel(day),
    Google: googleByDay[day],
    LinkedIn: linkedByDay[day],
    Facebook: facebookByDay[day],
    X: twitterByDay[day],
    Amazon: amazonByDay[day],
    Email: emailByDay[day],
  }));

  return {
    settings,
    providerList,
    enabledCount,
    steps,
    percentComplete,
    totalsByProvider,
    totalLogins,
    trend,
  };
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

const ICONS = {
  Google: GoogleIcon,
  LinkedIn: LinkedInIcon,
  Facebook: FacebookIcon,
  "X (Twitter)": XIcon,
  Amazon: AmazonIcon,
};

const NAVY = "#1a2b4c";
const LINE_COLORS = {
  Google: "#4285F4",
  LinkedIn: "#0A66C2",
  Facebook: "#1877F2",
  X: "#000000",
  Amazon: "#FF9900",
  Email: "#1a2b4c",
};

const styles = {
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  statCard: (accent) => ({
    flex: "1 1 160px",
    border: "1px solid #e1e1e1",
    borderRadius: "8px",
    padding: "16px 20px",
    background: "#fff",
    borderLeft: `4px solid ${accent}`,
  }),
  statValue: { fontSize: "26px", fontWeight: 700, lineHeight: 1.1 },
  statLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
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
  chartPad: { padding: "20px" },
  progressWrap: { padding: "18px 20px" },
  progressBarTrack: {
    width: "100%",
    height: "8px",
    borderRadius: "4px",
    background: "#e6e6e6",
    overflow: "hidden",
    marginTop: "10px",
  },
  progressBarFill: (percent) => ({
    width: `${percent}%`,
    height: "100%",
    background: percent === 100 ? "#2f8f4e" : NAVY,
    transition: "width 0.3s ease",
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
    fontWeight: 700,
    fontSize: "13px",
    color: "#fff",
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

function StatCard({ value, label, accent }) {
  return (
    <div style={styles.statCard(accent)}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

function StepCard({ number, step }) {
  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <div
          style={{
            ...styles.badge,
            background: step.done ? "#2f8f4e" : "#e6e6e6",
            color: step.done ? "#fff" : "#555",
          }}
        >
          {step.done ? "✓" : number}
        </div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600 }}>{step.title}</div>
          <div style={{ fontSize: "12px", color: "#888", maxWidth: "420px" }}>
            {step.description}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={styles.pill(step.done)}>
          {step.done ? "Complete" : "Action Required"}
        </span>
        {!step.done && (
          <a href={step.actionHref} target="_blank" rel="noreferrer" style={{ fontSize: "13px" }}>
            {step.actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}

function ProviderStatusRow({ label, enabled }) {
  const Icon = ICONS[label];
  return (
    <div style={styles.row}>
      <div style={styles.rowLeft}>
        <div style={styles.badge}>
          <Icon />
        </div>
        <span style={{ fontSize: "14px" }}>{label}</span>
      </div>
      <span style={styles.pill(enabled)}>
        {enabled ? "Enabled" : "Not Enabled"}
      </span>
    </div>
  );
}

export default function Index() {
  const {
    settings,
    providerList,
    enabledCount,
    steps,
    percentComplete,
    totalsByProvider,
    totalLogins,
    trend,
  } = useLoaderData();

  return (
    <s-page heading="Social Login">
      <TopIconNav active="home" />

      <s-banner tone={percentComplete === 100 ? "success" : "info"}>
        <s-heading>👋 Welcome to Social Login!</s-heading>
        <s-paragraph>
          Let your customers sign in with Google, LinkedIn, Facebook, X, or
          Amazon. Complete the setup below to activate it on your store.
        </s-paragraph>
      </s-banner>

      <div style={{ marginTop: "16px" }}>
        <div style={styles.statsRow}>
          <StatCard value="5" label="Providers Available" accent={NAVY} />
          <StatCard
            value={enabledCount}
            label="Providers Enabled"
            accent={enabledCount > 0 ? "#2f8f4e" : "#c0392b"}
          />
          <StatCard
            value={`${percentComplete}%`}
            label="Setup Complete"
            accent={percentComplete === 100 ? "#2f8f4e" : "#e0a11c"}
          />
          <StatCard value={totalLogins} label="Total Logins" accent="#6b46c1" />
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Your Setup Progress</div>
          <div style={styles.progressWrap}>
            <div style={{ fontSize: "13px", fontWeight: 600 }}>
              {percentComplete}% Complete
            </div>
            <div style={styles.progressBarTrack}>
              <div style={styles.progressBarFill(percentComplete)} />
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Required Setup Steps</div>
          {steps.map((step, i) => (
            <StepCard key={step.id} number={i + 1} step={step} />
          ))}
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Logins by Provider</div>
          <div style={styles.chartPad}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={totalsByProvider}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {totalsByProvider.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Logins — Last 7 Days</div>
          <div style={styles.chartPad}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {Object.keys(LINE_COLORS).map((key) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[key]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>Provider Status</div>
          {providerList.map((p) => (
            <ProviderStatusRow
              key={p.key}
              label={p.label}
              enabled={settings[p.key]}
            />
          ))}
        </div>
      </div>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};