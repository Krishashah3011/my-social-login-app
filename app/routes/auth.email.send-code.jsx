import prisma from "../db.server";
import nodemailer from "nodemailer";
import crypto from "crypto";

const RESEND_COOLDOWN_SECONDS_ML = 30;

const transporterML = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function isValidEmailML(emailML) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailML);
}

export async function action({ request: requestML }) {
  const formDataML = await requestML.formData();
  const emailML = (formDataML.get("email") || "").toString().trim().toLowerCase();
  const stateML = (formDataML.get("state") || "").toString();
  const redirect_uriML = (formDataML.get("redirect_uri") || "").toString();
  const nonceML = (formDataML.get("nonce") || "").toString();

  if (!isValidEmailML(emailML)) {
    return { error: "Enter a valid email address" };
  }

  const recentML = await prisma.emailOtp.findFirst({
    where: { email: emailML, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (recentML) {
    const secondsSinceLastML = (Date.now() - recentML.createdAt.getTime()) / 1000;
    if (secondsSinceLastML < RESEND_COOLDOWN_SECONDS_ML) {
      return {
        error: `Please wait ${Math.ceil(
          RESEND_COOLDOWN_SECONDS_ML - secondsSinceLastML
        )}s before requesting another code.`,
      };
    }
  }

  const codeML = crypto.randomInt(100000, 1000000).toString();
  const expiresAtML = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.emailOtp.create({
    data: {
      email: emailML,
      code: codeML,
      state: stateML,
      redirectUri: redirect_uriML,
      nonce: nonceML,
      expiresAt: expiresAtML,
    },
  });

  try {
    await transporterML.sendMail({
      from: `"Login" <${process.env.SMTP_FROM_EMAIL}>`,
      to: emailML,
      subject: "Your login code",
      html: `
        <p>Your verification code is:</p>
        <h2 style="letter-spacing:4px">${codeML}</h2>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  } catch (errML) {
    return { error: "Failed to send code. Try again." };
  }

  return {
    success: true,
    email: emailML,
    expiresInSeconds: 600,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS_ML,
  };
}