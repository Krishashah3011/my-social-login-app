import prisma from "../db.server";
import nodemailer from "nodemailer";
import crypto from "crypto";

const RESEND_COOLDOWN_SECONDS = 30;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function action({ request }) {
  const formData = await request.formData();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const state = (formData.get("state") || "").toString();
  const redirect_uri = (formData.get("redirect_uri") || "").toString();
  const nonce = (formData.get("nonce") || "").toString();

  if (!isValidEmail(email)) {
    return { error: "Enter a valid email address" };
  }

  const recent = await prisma.emailOtp.findFirst({
    where: { email, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (recent) {
    const secondsSinceLast = (Date.now() - recent.createdAt.getTime()) / 1000;
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      return {
        error: `Please wait ${Math.ceil(
          RESEND_COOLDOWN_SECONDS - secondsSinceLast
        )}s before requesting another code.`,
      };
    }
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.emailOtp.create({
    data: {
      email,
      code,
      state,
      redirectUri: redirect_uri,
      nonce,
      expiresAt,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Login" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: "Your login code",
      html: `
        <p>Your verification code is:</p>
        <h2 style="letter-spacing:4px">${code}</h2>
        <p>This code expires in 10 minutes.</p>
      `,
    });
  } catch (err) {
    return { error: "Failed to send code. Try again." };
  }

  return {
    success: true,
    email,
    expiresInSeconds: 600,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
  };
}