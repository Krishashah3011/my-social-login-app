export async function loader({ request }) {
  const url = new URL(request.url);

  const redirect_uri = url.searchParams.get("redirect_uri");
  const state = url.searchParams.get("state");
  const nonce = url.searchParams.get("nonce");

  const providerURL =
    `/select-provider?` +
    `state=${encodeURIComponent(state || "")}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri || "")}` +
    `&nonce=${encodeURIComponent(nonce || "")}`;

  return Response.redirect(
    new URL(providerURL, url.origin)
  );
}

export default function Authorize() {
  return null;
}