import { LoginErrorType } from "@shopify/shopify-app-react-router/server";

export function loginErrorMessage(loginErrorsML) {
  if (loginErrorsML?.shop === LoginErrorType.MissingShop) {
    return { shop: "Please enter your shop domain to log in" };
  } else if (loginErrorsML?.shop === LoginErrorType.InvalidShop) {
    return { shop: "Please enter a valid shop domain to log in" };
  }

  return {};
}