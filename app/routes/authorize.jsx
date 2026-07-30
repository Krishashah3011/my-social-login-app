export async function loader({ request }) {
  const url = new URL(request.url);

  const client_id = url.searchParams.get("client_id");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");

  console.log("SHOPIFY REDIRECT RECEIVED:", redirect_uri);
  console.log("OIDC CLIENT:", client_id);
  console.log("STATE:", state);
  console.log("NONCE:", nonce);

  const providerURL =
    `/select-provider?` +
    `state=${encodeURIComponent(state || "")}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
    `&nonce=${encodeURIComponent(nonce || "")}`;

  console.log(
    "REDIRECTING TO PROVIDER SELECTOR:",
    providerURL
  );

  return Response.redirect(
    new URL(providerURL, url.origin)
  );
}

export default function Authorize() {
  return null;
}