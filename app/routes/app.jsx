import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticateAdminOnceML } from "../utils/authCache.server";

export const loader = async ({ request: requestML }) => {
  const { session: sessionML } = await authenticateAdminOnceML(requestML);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    shop: sessionML.shop,
  };
};

export default function App() {
  const { apiKey: apiKeyML, shop: shopML } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKeyML} shop={shopML}>
      <s-app-nav>
        <s-link href="/app">Home</s-link>
      </s-app-nav>

      <div style={{ maxWidth: "950px", width: "100%", margin: "0 auto" }}>
        <Outlet />
      </div>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgsML) => {
  return boundary.headers(headersArgsML);
};