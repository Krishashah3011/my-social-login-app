import { redirect } from "react-router";

export async function loader() {
  return redirect("/account/logout");
}

export default function GoogleLogout() {
  return null;
}