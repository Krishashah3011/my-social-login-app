import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request: requestML }) => {
  await authenticate.admin(requestML);

  return null;
};

export const headers = (headersArgsML) => {
  return boundary.headers(headersArgsML);
};