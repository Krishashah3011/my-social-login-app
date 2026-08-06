import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";

export async function action({ request: requestML }) {
  const formDataML = await requestML.formData();
  const emailML = (formDataML.get("email") || "").toString().trim().toLowerCase();
  const codeML = (formDataML.get("code") || "").toString().trim();
  const stateML = (formDataML.get("state") || "").toString();
  const redirect_uriML = (formDataML.get("redirect_uri") || "").toString();
  const nonceML = (formDataML.get("nonce") || "").toString();

  const otpML = await prisma.emailOtp.findFirst({
    where: { email: emailML, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otpML) {
    return { error: "No code found. Request a new one." };
  }

  if (otpML.expiresAt < new Date()) {
    return { error: "Code expired. Request a new one." };
  }

  if (otpML.attempts >= 5) {
    return { error: "Too many attempts. Request a new code." };
  }

  if (otpML.code !== codeML) {
    await prisma.emailOtp.update({
      where: { id: otpML.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "Incorrect code." };
  }

  await prisma.emailOtp.update({
    where: { id: otpML.id },
    data: { consumed: true },
  });

  const shopSessionML = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSessionML) {
    return new Response("No Shopify session found", { status: 500 });
  }

  const { admin: adminML } = await unauthenticated.admin(shopSessionML.shop);

  let shopifyCustomerIdML = null;

  const existingCustomerResponseML = await adminML.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${emailML}") {
        edges { node { id email } }
      }
    }`,
  );
  const existingDataML = await existingCustomerResponseML.json();
  const existingCustomerML = existingDataML.data?.customers?.edges[0]?.node;

  if (existingCustomerML) {
    shopifyCustomerIdML = existingCustomerML.id;
  } else {
    const customerResponseML = await adminML.graphql(
      `#graphql
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input:$input){
          customer { id email }
          userErrors { field message }
        }
      }`,
      { variables: { input: { email: emailML } } },
    );
    const resultML = await customerResponseML.json();
    const customerCreateResultML = resultML.data?.customerCreate;

    if (!customerCreateResultML || customerCreateResultML.userErrors.length > 0) {
      return { error: "Could not create account. Try again." };
    }

    shopifyCustomerIdML = customerCreateResultML.customer?.id;
  }

  const authCodeML = crypto.randomUUID();

  await saveCode(authCodeML, {
    email: emailML,
    name: emailML.split("@")[0],
    id: shopifyCustomerIdML,
    nonce: nonceML,
  });

  if (!redirect_uriML) {
    return { error: "Missing redirect_uri" };
  }

  return redirect(`${redirect_uriML}?code=${authCodeML}&state=${stateML}`);
}