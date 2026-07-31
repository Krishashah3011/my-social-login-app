import { useEffect } from "react";
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
  const field = formData.get("field");
  const value = formData.get("value") === "true";

    const allowedFields = ["googleEnabled", "twitterEnabled","facebookEnabled","linkedinEnabled"];
  if (!allowedFields.includes(field)) {
    return { error: "Invalid field" };
  }

  const settings = await db.shopSettings.update({
    where: { shop: session.shop },
    data: { [field]: value },
  });

  return { settings };
};

function ProviderToggle({ label, field, checked, disabled, helpText }) {
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const isSaving = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.settings) {
      shopify.toast.show(`${label} updated`);
    }
    if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, label, shopify]);

  const toggle = () => {
    if (disabled) return;
    fetcher.submit(
      { field, value: String(!checked) },
      { method: "POST" },
    );
  };

  return (
    <s-stack direction="inline" gap="base" alignItems="center">
      <s-switch
        checked={checked}
        disabled={disabled || isSaving}
        onChange={toggle}
      />
      <s-stack direction="block" gap="none">
        <s-text>{label}</s-text>
        {helpText && (
          <s-text tone="subdued" size="small">
            {helpText}
          </s-text>
        )}
      </s-stack>
    </s-stack>
  );
}

export default function Settings() {
  const { settings } = useLoaderData();

  return (
    <s-page heading="Settings">
      <TopIconNav active="settings" />

      <s-section heading="Login Providers">
        <s-stack direction="block" gap="loose">
          <ProviderToggle
            label="Google Login"
            field="googleEnabled"
            checked={settings.googleEnabled}
          />
          <ProviderToggle
            label="Twitter / X Login"
            field="twitterEnabled"
            checked={settings.twitterEnabled}
          />
          <ProviderToggle
            label="Facebook Login"
            field="facebookEnabled"
            checked={settings.facebookEnabled}
          />
          <ProviderToggle
            label="LinkedIn Login"
            field="linkedinEnabled"
            checked={settings.linkedinEnabled}
          />
        </s-stack>
      </s-section>
    </s-page>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};