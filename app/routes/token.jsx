import { getCode } from "../utils/authCodes.server";
import { createOIDCToken } from "../utils/oidc.server";

export async function action({ request: requestML }) {

  const urlML = new URL(requestML.url);
  const hostML = requestML.headers.get("x-forwarded-host") || urlML.host;
  const issuerML = `https://${hostML}`;

  const bodyML = await requestML.text();

  const paramsML = new URLSearchParams(bodyML);

  const codeML = paramsML.get("code");
  let client_idML = paramsML.get("client_id");
  let client_secretML = paramsML.get("client_secret");

  const authHeaderML = requestML.headers.get("authorization");

  if (!client_idML && authHeaderML?.startsWith("Basic ")) {
    const decodedML = Buffer.from(authHeaderML.slice(6), "base64").toString("utf-8");
    const [headerClientIdML, headerClientSecretML] = decodedML.split(":");

    client_idML = headerClientIdML;
    client_secretML = headerClientSecretML;
  }

  if (
    client_idML !== process.env.OIDC_CLIENT_ID ||
    client_secretML !== process.env.OIDC_CLIENT_SECRET
  ) {
    return Response.json(
      { error: "invalid_client" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  if (!codeML) {
    return Response.json(
      { error: "invalid_request" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const userML = await getCode(codeML);

  if (!userML) {
    return Response.json(
      { error: "invalid_grant" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const id_tokenML = await createOIDCToken({
    email: userML.email,
    name: userML.name,
    id: userML.id,
    nonce: userML.nonce,
    client_id: client_idML,
    issuer: issuerML,
  });

  const [, payloadB64ML] = id_tokenML.split(".");
  const decodedPayloadML = JSON.parse(
    Buffer.from(payloadB64ML, "base64").toString()
  );

  const responseBodyML = {
    access_token: id_tokenML,
    token_type: "Bearer",
    expires_in: 300,
    id_token: id_tokenML,
    scope: "openid email customer-account-api:full",
  };

  return new Response(JSON.stringify(responseBodyML), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export async function loader() {
  return new Response(null, {
    status: 405,
  });
}