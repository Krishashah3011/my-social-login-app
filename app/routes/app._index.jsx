import { useLoaderData, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticateAdminOnceML } from "../utils/authCache.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";
import GetStartedGuide from "../components/GetStartedGuide";
import { useEffect, useState } from "react";

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

export const loader = async ({ request: requestML }) => {
  const { session: sessionML } = await authenticateAdminOnceML(requestML);

  let settingsML = await db.shopSettings.findUnique({
    where: { shop: sessionML.shop },
  });

  if (!settingsML) {
    settingsML = await db.shopSettings.create({
      data: { shop: sessionML.shop },
    });
  }

  const providerListML = [
    { key: "googleEnabled", label: "Google" },
    { key: "linkedinEnabled", label: "LinkedIn" },
    { key: "facebookEnabled", label: "Facebook" },
    { key: "twitterEnabled", label: "X (Twitter)" },
    { key: "amazonEnabled", label: "Amazon" },
  ];

  const totalProvidersML = providerListML.length;
  const enabledCountML = providerListML.filter((pML) => settingsML[pML.key]).length;
  const allProvidersEnabledML = enabledCountML === totalProvidersML;

  const percentCompleteML = Math.round(
    (enabledCountML / totalProvidersML) * 100,
  );

  const stepsML = [
    {
      id: "providers",
      title: "Enable a Login Provider",
      description:
        "Turn on at least one social login provider (Facebook, Linkedin, Google, X or Amazon) in settings.",
      done: allProvidersEnabledML,
      actionLabel: allProvidersEnabledML ? "Completed" : "Complete",
      actionHref: "/app/settings",
    },
  ];

  const [
    googleUsersML,
    linkedUsersML,
    facebookUsersML,
    twitterUsersML,
    amazonUsersML,
    emailVerifiedML,
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

  const totalsByProviderML = [
    {
      name: "Google",
      count: googleUsersML.length,
      color: "#073E74",
    },
    {
      name: "LinkedIn",
      count: linkedUsersML.length,
      color: "#1C5A94",
    },
    {
      name: "Facebook",
      count: facebookUsersML.length,
      color: "#2E73B8",
    },
    {
      name: "X",
      count: twitterUsersML.length,
      color: "#4D90D6",
    },
    {
      name: "Amazon",
      count: amazonUsersML.length,
      color: "#7BAFE5",
    },
    {
      name: "Email",
      count: emailVerifiedML.length,
      color: "#96BF47",
    },
  ];

  const daysML = [];

  for (let iML = 6; iML >= 0; iML--) {
    const dML = new Date();
    dML.setDate(dML.getDate() - iML);
    daysML.push(dML.toISOString().slice(0, 10));
  }

  const dayLabelML = (isoDateML) => {
    const dML = new Date(isoDateML);

    return dML.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const countByDayML = (recordsML) => {
    const mapML = {};

    for (const dayML of daysML) {
      mapML[dayML] = 0;
    }

    for (const rML of recordsML) {
      const dayML = rML.createdAt.toISOString().slice(0, 10);

      if (dayML in mapML) {
        mapML[dayML]++;
      }
    }

    return mapML;
  };

  const googleByDayML = countByDayML(googleUsersML);
  const linkedByDayML = countByDayML(linkedUsersML);
  const facebookByDayML = countByDayML(facebookUsersML);
  const twitterByDayML = countByDayML(twitterUsersML);
  const amazonByDayML = countByDayML(amazonUsersML);
  const emailByDayML = countByDayML(emailVerifiedML);

  const trendML = daysML.map((dayML) => ({
    date: dayLabelML(dayML),
    Google: googleByDayML[dayML],
    LinkedIn: linkedByDayML[dayML],
    Facebook: facebookByDayML[dayML],
    X: twitterByDayML[dayML],
    Amazon: amazonByDayML[dayML],
    Email: emailByDayML[dayML],
  }));

  const embedExtensionUuidML = "5cbbea68-b1fc-5b70-4f63-8fd90c3685ac53138c82";
  const embedBlockHandleML = "social_login";

  const embedDeepLinkML = `https://${sessionML.shop}/admin/themes/current/editor?context=apps&appEmbed=${embedExtensionUuidML}/${embedBlockHandleML}`;

  const storeHandleML = sessionML.shop.replace(".myshopify.com", "");
  const identityProvidersDeepLinkML = `https://admin.shopify.com/store/${storeHandleML}/settings/customer_accounts/authentication/identity_providers`;

  return {
    settings: settingsML,
    steps: stepsML,
    percentComplete: percentCompleteML,
    totalsByProvider: totalsByProviderML,
    trend: trendML,
    embedDeepLink: embedDeepLinkML,
    identityProvidersDeepLink: identityProvidersDeepLinkML,
    registered: settingsML.registered,
  };
};

const BLUE_ML = "#073E74";
const BORDER_ML = "#E5E5E5";
const DIVIDER_ML = "#DBDBDB";
const TEXT_BLACK_ML = "#000000";
const TEXT_MUTED_ML = "#373737";

const BAR_COLORS_ML = [
  "#073E74",
  "#0D4D8C",
  "#1C5A94",
  "#2D6FA9",
  "#5E95C9",
  "#96BF47",
];

const LINE_COLORS_ML = {
  Google: "#073E74",
  LinkedIn: "#0D4D8C",
  Facebook: "#1C5A94",
  X: "#2D6FA9",
  Amazon: "#5E95C9",
  Email: "#96BF47",
};

const stylesML = {

  card: {
    background: "#FFFFFF",
    border: `1px solid ${BORDER_ML}`,
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "16px",
  },

    sectionHeading: {
    fontFamily: "Inter",
    fontWeight: 600,
    fontSize: "18px",
    lineHeight: "22px",
    letterSpacing: "0.02em",
    color: TEXT_BLACK_ML,
    margin: 0,
  },

  divider: {
    border: "none",
    borderTop: `1px solid ${DIVIDER_ML}`,
    margin: 0,
    width: "100%",
  },

  stepRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },

  stepTitle: {
    fontFamily: "Inter",
    fontWeight: 500,
    fontSize: "14px",
    lineHeight: "17px",
    color: TEXT_BLACK_ML,
    margin: 0,
  },

  stepDescription: {
    fontFamily: "Inter",
    fontWeight: 400,
    fontSize: "12px",
    lineHeight: "15px",
    color: TEXT_MUTED_ML,
    margin: "4px 0 0",
    maxWidth: "606px",
  },

  stepButton: {
    padding: "10px",
    background: BLUE_ML,
    borderRadius: "10px",
    color: "#FFFFFF",
    fontFamily: "Inter",
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
    fontFamily: "Inter",
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

const MOBILE_BREAKPOINT_ML = 480;

function useIsMobileML() {
  const [isMobileML, setIsMobileML] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= MOBILE_BREAKPOINT_ML;
  });

  useEffect(() => {
    const handleResizeML = () => {
      setIsMobileML(window.innerWidth <= MOBILE_BREAKPOINT_ML);
    };

    handleResizeML();
    window.addEventListener("resize", handleResizeML);
    return () => window.removeEventListener("resize", handleResizeML);
  }, []);

  return isMobileML;
}

export default function Index() {
  const {
    steps: stepsML,
    totalsByProvider: totalsByProviderML,
    trend: trendML,
    embedDeepLink: embedDeepLinkML,
    identityProvidersDeepLink: identityProvidersDeepLinkML,
    registered: registeredML,
  } = useLoaderData();

  const isMobileML = useIsMobileML();

  return (
    <s-page heading="Social Login App" inlineSize="950px">
      <TopIconNav active="home" />

      <img
        src="/banner.png"
        alt="Welcome to Milople Social Login App"
        style={stylesML.heroBanner}
      />

      <GetStartedGuide
        appName="Milople Social Login App"
        embedDeepLink={embedDeepLinkML}
        identityProvidersDeepLink={identityProvidersDeepLinkML}
        registered={registeredML}
      />

      {registeredML && (
      <>
      <div style={stylesML.card}>
        <h2 style={stylesML.sectionHeading}>
          Logins by Provider
        </h2>

        <hr style={stylesML.divider} />

        <div style={stylesML.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={totalsByProviderML}
              margin={{
                top: 10,
                right: isMobileML ? 4 : 20,
                left: 0,
                bottom: isMobileML ? 24 : 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E8E8E8"
              />

              <XAxis
                dataKey="name"
                interval={0}
                angle={isMobileML ? -35 : 0}
                textAnchor={isMobileML ? "end" : "middle"}
                height={isMobileML ? 45 : 30}
                tick={{
                  fontSize: isMobileML ? 10 : 12,
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
                {totalsByProviderML.map((entryML, indexML) => (
                  <Cell
                    key={indexML}
                    fill={BAR_COLORS_ML[indexML]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={stylesML.card}>
        <h2 style={stylesML.sectionHeading}>
          Logins in Last 7 Days
        </h2>

        <hr style={stylesML.divider} />

        <div style={stylesML.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendML}
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
                  fontSize: isMobileML ? "10px" : "12px",
                }}
              />

              {Object.keys(LINE_COLORS_ML).map((providerML) => (
                <Line
                  key={providerML}
                  type="monotone"
                  dataKey={providerML}
                  stroke={LINE_COLORS_ML[providerML]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      </>
      )}
          </s-page>
  );
}

export const headers = (headersArgsML) => {
  return boundary.headers(headersArgsML);
};