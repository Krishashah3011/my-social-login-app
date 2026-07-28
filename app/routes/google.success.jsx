import { useLoaderData } from "react-router";
import { getSession } from "../session.server";

export async function loader({ request }) {
  const session = await getSession(
    request.headers.get("Cookie")
  );

  return {
    user: session.get("googleUser"),
  };
}

export default function GoogleSuccess() {
  const { user } = useLoaderData();

  return (
    <div>
      <h1>Google Login Successful 🎉</h1>

      {user && (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>

          <img src={user.picture} alt="profile" />
        </>
      )}

      <a href="/google/logout">Logout</a>
    </div>
  );
}