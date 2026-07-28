import { createCookieSessionStorage } from "react-router";

const sessionSecret = process.env.SESSION_SECRET || "dev-secret";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "google_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
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