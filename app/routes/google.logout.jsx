import { redirect } from "react-router";
import { getSession, destroySession } from "../session.server";

export async function loader({ request }) {
  const session = await getSession(
    request.headers.get("Cookie")
  );

  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export default function GoogleLogout() {
  return null;
}