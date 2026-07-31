import { useLoaderData } from "react-router";
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

  const enabledCount = [
    settings.googleEnabled,
    settings.twitterEnabled,
    settings.facebookEnabled,
    settings.linkedinEnabled,
  ].filter(Boolean).length;

  return {
    shop: session.shop,
    settings,
    enabledCount,
  };
};

export default function Account() {
  const { shop, settings, enabledCount } = useLoaderData();

  return (
    <s-page heading="Account">
      <TopIconNav active="account" />

      <s-section heading="Store">
        <s-stack direction="block" gap="base">
          <s-stack direction="inline" gap="base">
            <s-text tone="subdued">Store domain</s-text>
            <s-text>{shop}</s-text>
          </s-stack>
        </s-stack>
      </s-section>

      <s-section heading="Login Providers">
        <s-paragraph>
          {enabledCount} of 4 providers currently enabled.
        </s-paragraph>
        <s-stack direction="block" gap="tight">
          <s-text>Google — {settings.googleEnabled ? "Enabled" : "Disabled"}</s-text>
          <s-text>
            Twitter / X — {settings.twitterEnabled ? "Enabled" : "Disabled"}
          </s-text>
          <s-text>
            Facebook — {settings.facebookEnabled ? "Enabled" : "Disabled"}
          </s-text>
          <s-text>
            LinkedIn — {settings.linkedinEnabled ? "Enabled" : "Disabled"}
          </s-text>
        </s-stack>
        <s-link href="/app/settings">Manage in Settings</s-link>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};