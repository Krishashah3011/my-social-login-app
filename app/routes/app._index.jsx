import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import TopIconNav from "../components/TopIconNav";

const EXTENSION_NAME = "social-login-widget";

async function getEmbedStatus(admin) {
  const response = await admin.graphql(
    `#graphql
      query GetMainThemeSettings {
        themes(first: 1, roles: [MAIN]) {
          nodes {
            id
            files(filenames: ["config/settings_data.json"], first: 1) {
              nodes {
                body {
                  ... on OnlineStoreThemeFileBodyText {
                    content
                  }
                }
              }
            }
          }
        }
      }`,
  );
  const data = await response.json();
  const content =
    data?.data?.themes?.nodes?.[0]?.files?.nodes?.[0]?.body?.content;
  if (!content) return false;

  try {
    const parsed = JSON.parse(content);
    const blocks = parsed?.current?.blocks || {};
    return Object.values(blocks).some(
      (block) =>
        typeof block?.type === "string" &&
        block.type.includes(EXTENSION_NAME) &&
        block.disabled !== true,
    );
  } catch {
    return false;
  }
}

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

  const embedEnabled = await getEmbedStatus(admin);

  const anyProviderEnabled =
    settings.googleEnabled ||
    settings.twitterEnabled ||
    settings.facebookEnabled ||
    settings.linkedinEnabled;

  const steps = [
    {
      id: "providers",
      title: "Enable a Login Provider",
      description:
        "Turn on at least one social login provider (Google, Twitter/X, Facebook, or LinkedIn) in Settings.",
      done: anyProviderEnabled,
      actionLabel: "Configure Providers",
      actionHref: "/app/settings",
    },
    {
      id: "embed",
      title: "Enable Storefront Embed Block",
      description:
        "Enable the Social Login embed block in your theme editor so the login button appears on your storefront.",
      done: embedEnabled,
      actionLabel: "Open Theme Editor",
      actionHref: `https://${session.shop}/admin/themes/current/editor?context=apps`,
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const percentComplete = Math.round((completedCount / steps.length) * 100);

  return { settings, embedEnabled, steps, percentComplete };
};

function ProgressBar({ percent }) {
  return (
    <div
      style={{
        width: "100%",
        height: "8px",
        borderRadius: "4px",
        background: "var(--s-color-bg-surface-secondary, #e3e3e3)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: "100%",
          background:
            percent === 100
              ? "var(--s-color-bg-fill-success, #3ba25a)"
              : "var(--s-color-bg-fill-brand, #4d7cfe)",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function StatusRow({ label, enabled }) {
  return (
    <s-stack direction="inline" gap="base" alignItems="center">
      <s-text>{label}</s-text>
      <s-badge tone={enabled ? "success" : "warning"}>
        {enabled ? "Enabled" : "Not Enabled"}
      </s-badge>
    </s-stack>
  );
}

function StepCard({ number, step }) {
  return (
    <s-box
      padding="base"
      borderWidth="base"
      borderRadius="base"
      background={step.done ? "subdued" : undefined}
    >
      <s-stack direction="inline" gap="base" alignItems="start">
        <div
          style={{
            width: "28px",
            height: "28px",
            minWidth: "28px",
            borderRadius: "50%",
            background: step.done
              ? "var(--s-color-bg-fill-success, #3ba25a)"
              : "var(--s-color-bg-surface-secondary, #e3e3e3)",
            color: step.done ? "#fff" : "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "13px",
          }}
        >
          {step.done ? "✓" : number}
        </div>

        <s-stack direction="block" gap="tight" style={{ flex: 1 }}>
          <s-stack direction="inline" gap="base" alignItems="center">
            <s-text fontWeight="semibold">{step.title}</s-text>
            <s-badge tone={step.done ? "success" : "attention"}>
              {step.done ? "Complete" : "Action Required"}
            </s-badge>
          </s-stack>
          <s-text tone="subdued">{step.description}</s-text>
          {!step.done && (
            <s-link href={step.actionHref} target="_blank">
              {step.actionLabel}
            </s-link>
          )}
        </s-stack>
      </s-stack>
    </s-box>
  );
}

export default function Index() {
  const { settings, embedEnabled, steps, percentComplete } = useLoaderData();

  return (
    <s-page heading="Social Login">
      <TopIconNav active="home" />

      <s-banner tone={percentComplete === 100 ? "success" : "info"}>
        <s-heading>👋 Welcome to Social Login!</s-heading>
        <s-paragraph>
          Let your customers sign in with Google, Twitter/X, Facebook, or
          LinkedIn. Complete the setup below to activate it on your store.
        </s-paragraph>
      </s-banner>

      <s-section heading="Your Setup Progress">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base" alignItems="center">
            <s-text fontWeight="semibold">
              {percentComplete}% Complete
            </s-text>
          </s-stack>
          <ProgressBar percent={percentComplete} />
          {percentComplete < 100 && (
            <s-text tone="subdued">
              Complete the remaining steps below to get social login working.
            </s-text>
          )}
        </s-stack>
      </s-section>

      <s-section heading="Required Setup Steps">
        <s-stack direction="block" gap="base">
          {steps.map((step, i) => (
            <StepCard key={step.id} number={i + 1} step={step} />
          ))}
        </s-stack>
      </s-section>

      <s-section heading="Provider Status">
        <s-stack direction="block" gap="base">
          <StatusRow label="Google Login" enabled={settings.googleEnabled} />
          <StatusRow
            label="Twitter / X Login"
            enabled={settings.twitterEnabled}
          />
          <StatusRow
            label="Facebook Login"
            enabled={settings.facebookEnabled}
          />
          <StatusRow
            label="LinkedIn Login"
            enabled={settings.linkedinEnabled}
          />
          <StatusRow label="Storefront Embed Block" enabled={embedEnabled} />
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};