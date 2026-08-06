import { redirect } from "react-router";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";
import crypto from "crypto";
import { saveCode } from "../utils/authCodes.server";

export async function action({ request }) {
  const formData = await request.formData();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const code = (formData.get("code") || "").toString().trim();
  const state = (formData.get("state") || "").toString();
  const redirect_uri = (formData.get("redirect_uri") || "").toString();
  const nonce = (formData.get("nonce") || "").toString();

  const otp = await prisma.emailOtp.findFirst({
    where: { email, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return { error: "No code found. Request a new one." };
  }

  if (otp.expiresAt < new Date()) {
    return { error: "Code expired. Request a new one." };
  }

  if (otp.attempts >= 5) {
    return { error: "Too many attempts. Request a new code." };
  }

  if (otp.code !== code) {
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "Incorrect code." };
  }

  await prisma.emailOtp.update({
    where: { id: otp.id },
    data: { consumed: true },
  });

  const shopSession = await prisma.session.findFirst({
    where: { isOnline: false },
  });

  if (!shopSession) {
    return new Response("No Shopify session found", { status: 500 });
  }

  const { admin } = await unauthenticated.admin(shopSession.shop);

  let shopifyCustomerId = null;

  const existingCustomerResponse = await admin.graphql(
    `#graphql
    query {
      customers(first:1, query:"email:${email}") {
        edges { node { id email } }
      }
    }`,
  );
  const existingData = await existingCustomerResponse.json();
  const existingCustomer = existingData.data?.customers?.edges[0]?.node;

  if (existingCustomer) {
    shopifyCustomerId = existingCustomer.id;
  } else {
    const customerResponse = await admin.graphql(
      `#graphql
      mutation customerCreate($input: CustomerInput!) {
        customerCreate(input:$input){
          customer { id email }
          userErrors { field message }
        }
      }`,
      { variables: { input: { email } } },
    );
    const result = await customerResponse.json();
    const customerCreateResult = result.data?.customerCreate;

    if (!customerCreateResult || customerCreateResult.userErrors.length > 0) {
      return { error: "Could not create account. Try again." };
    }

    shopifyCustomerId = customerCreateResult.customer?.id;
  }

  const authCode = crypto.randomUUID();

  await saveCode(authCode, {
    email,
    name: email.split("@")[0],
    id: shopifyCustomerId,
    nonce,
  });

  if (!redirect_uri) {
    return { error: "Missing redirect_uri" };
  }

  return redirect(`${redirect_uri}?code=${authCode}&state=${state}`);
}