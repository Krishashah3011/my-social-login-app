import { createCookieSessionStorage } from "react-router";

const sessionSecretML = process.env.SESSION_SECRET || "dev-secret";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "google_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecretML],
    sameSite: "lax",
    path: "/",
    httpOnly: true,
  },
});

export const {
  getSession,
  commitSession,
  destroySession,
} = sessionStorage;