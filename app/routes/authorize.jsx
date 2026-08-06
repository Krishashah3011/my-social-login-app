export async function loader({ request: requestML }) {
  const urlML = new URL(requestML.url);

  const redirect_uriML = urlML.searchParams.get("redirect_uri");
  const stateML = urlML.searchParams.get("state");
  const nonceML = urlML.searchParams.get("nonce");

  const providerURLML =
    `/select-provider?` +
    `state=${encodeURIComponent(stateML || "")}` +
    `&redirect_uri=${encodeURIComponent(redirect_uriML || "")}` +
    `&nonce=${encodeURIComponent(nonceML || "")}`;

  return Response.redirect(
    new URL(providerURLML, urlML.origin)
  );
}

export default function Authorize() {
  return null;
}