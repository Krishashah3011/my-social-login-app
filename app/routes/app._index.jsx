import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
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

  const totalProviders = providerList.length;
  const enabledCount = providerList.filter((p) => settings[p.key]).length;
  const allProvidersEnabled = enabledCount === totalProviders;

  const percentComplete = Math.round(
    (enabledCount / totalProviders) * 100,
  );

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

  const [
    googleUsers,
    linkedUsers,
    facebookUsers,
    twitterUsers,
    amazonUsers,
    emailVerified,
  ] = await Promise.all([
    db.googleUser.findMany({
      select: { createdAt: true },
    }),
    db.linkedUser.findMany({
      select: { createdAt: true },
    }),
    db.facebookUser.findMany({
      select: { createdAt: true },
    }),
    db.twitterUser.findMany({
      select: { createdAt: true },
    }),
    db.amazonUser.findMany({
      select: { createdAt: true },
    }),
    db.emailOtp.findMany({
      where: { consumed: true },
      select: { createdAt: true },
    }),
  ]);

  const totalsByProvider = [
    {
      name: "Google",
      count: googleUsers.length,
      color: "#073E74",
    },
    {
      name: "LinkedIn",
      count: linkedUsers.length,
      color: "#1C5A94",
    },
    {
      name: "Facebook",
      count: facebookUsers.length,
      color: "#2E73B8",
    },
    {
      name: "X",
      count: twitterUsers.length,
      color: "#4D90D6",
    },
    {
      name: "Amazon",
      count: amazonUsers.length,
      color: "#7BAFE5",
    },
    {
      name: "Email",
      count: emailVerified.length,
      color: "#96BF47",
    },
  ];

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const dayLabel = (isoDate) => {
    const d = new Date(isoDate);

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const countByDay = (records) => {
    const map = {};

    for (const day of days) {
      map[day] = 0;
    }

    for (const r of records) {
      const day = r.createdAt.toISOString().slice(0, 10);

      if (day in map) {
        map[day]++;
      }
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
    steps,
    percentComplete,
    totalsByProvider,
    trend,
  };
};

const BLUE = "#073E74";
const BORDER = "#E5E5E5";
const DIVIDER = "#DBDBDB";
const TEXT_BLACK = "#000000";
const TEXT_MUTED = "#373737";

const BAR_COLORS = [
  "#073E74",
  "#0D4D8C",
  "#1C5A94",
  "#2D6FA9",
  "#5E95C9",
  "#96BF47",
];

const LINE_COLORS = {
  Google: "#073E74",
  LinkedIn: "#0D4D8C",
  Facebook: "#1C5A94",
  X: "#2D6FA9",
  Amazon: "#5E95C9",
  Email: "#96BF47",
};

const styles = {

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

  chartContainer: {
    width: "100%",
    height: "320px",
    marginTop: "16px",
  },

  heroBanner: {
    width: "100%",
    borderRadius: "20px",
    display: "block",
    marginBottom: "16px",
  },
};

export default function Index() {
  const {
    steps,
    percentComplete,
    totalsByProvider,
    trend,
  } = useLoaderData();

  return (
    <s-page heading="Social Login App">
      <TopIconNav active="home" />

      <img
        src="/banner.png"
        alt="Welcome to Milople Social Login App"
        style={styles.heroBanner}
      />

      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Your Setup Progress
        </h2>

        <hr style={styles.divider} />

        <div>
          <div style={styles.progressLabel}>
            {percentComplete}% Complete
          </div>

          <div style={styles.progressTrack}>
            <div
              style={styles.progressFill(percentComplete)}
            />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Required Setup Steps
        </h2>

        <hr style={styles.divider} />

        {steps.map((step) => (
          <div
            key={step.id}
            style={styles.stepRow}
          >
            <div>
              <p style={styles.stepTitle}>
                {step.title}
              </p>

              <p style={styles.stepDescription}>
                {step.description}
              </p>
            </div>

            {step.done ? (
              <span style={styles.stepDonePill}>
                {step.actionLabel}
              </span>
            ) : (
              <Link
                to={step.actionHref}
                style={{ textDecoration: "none" }}
              >
                <button style={styles.stepButton}>
                  {step.actionLabel}
                </button>
              </Link>
            )}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Logins by Provider
        </h2>

        <hr style={styles.divider} />

        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={totalsByProvider}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8E8E8"
              />

              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 12,
                  fill: "#424242",
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                  fill: "#424242",
                }}
              />

              <Tooltip />

              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
              >
                {totalsByProvider.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={BAR_COLORS[index]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Logins in Last 7 Days
        </h2>

        <hr style={styles.divider} />

        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trend}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8E8E8"
              />

              <XAxis
                dataKey="date"
                tick={{
                  fontSize: 12,
                  fill: "#424242",
                }}
              />

              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 12,
                  fill: "#424242",
                }}
              />

              <Tooltip />

              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                }}
              />

              {Object.keys(LINE_COLORS).map((provider) => (
                <Line
                  key={provider}
                  type="monotone"
                  dataKey={provider}
                  stroke={LINE_COLORS[provider]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
          </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};