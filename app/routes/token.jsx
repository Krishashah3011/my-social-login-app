import { getCode } from "../utils/authCodes.server";
import { createOIDCToken } from "../utils/oidc.server";

export async function action({ request }) {
  console.log("TOKEN ENDPOINT HIT");

  const body = await request.text();
  console.log("TOKEN BODY:", body);

  const params = new URLSearchParams(body);

  const code = params.get("code");
  let client_id = params.get("client_id");
  let client_secret = params.get("client_secret");

  const authHeader = request.headers.get("authorization");
  console.log("AUTH HEADER:", authHeader);

  console.log("EXPECTED CLIENT:", process.env.OIDC_CLIENT_ID);
  console.log("EXPECTED SECRET:", process.env.OIDC_CLIENT_SECRET);

  if (!client_id && authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf-8");
    const [headerClientId, headerClientSecret] = decoded.split(":");

    client_id = headerClientId;
    client_secret = headerClientSecret;
  }

  console.log("AUTH CODE:", code);
  console.log("CLIENT ID:", client_id);

  if (
    client_id !== process.env.OIDC_CLIENT_ID ||
    client_secret !== process.env.OIDC_CLIENT_SECRET
  ) {
    console.log("INVALID CLIENT CREDENTIALS");

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

  if (!code) {
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

  const user = await getCode(code);

  console.log("USER FROM CODE:", user);

  if (!user) {
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

  const id_token = await createOIDCToken({
    email: user.email,
    name: user.name,
    id: user.id,
    nonce: user.nonce,
  });

  console.log("ID TOKEN CREATED");

  const [, payloadB64] = id_token.split(".");
  const decodedPayload = JSON.parse(
    Buffer.from(payloadB64, "base64").toString()
  );

  console.log("DECODED ID TOKEN PAYLOAD:", decodedPayload);

  const responseBody = {
    access_token: id_token,
    token_type: "Bearer",
    expires_in: 300,
    id_token,
    scope: "openid email customer-account-api:full",
  };

  console.log(
    "FINAL TOKEN RESPONSE:",
    JSON.stringify(responseBody, null, 2)
  );

  console.log("RETURNING JSON NOW");

  return new Response(JSON.stringify(responseBody), {
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