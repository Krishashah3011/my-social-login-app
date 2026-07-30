import { useSearchParams } from "react-router";

export default function SelectProvider() {
  const [searchParams] = useSearchParams();

  const state = searchParams.get("state") || "";
  const redirect_uri =
    searchParams.get("redirect_uri") || "";
  const nonce =
    searchParams.get("nonce") || "";

  const googleURL =
    `/auth/google?state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&nonce=${encodeURIComponent(nonce)}`;

  const linkedURL =
    `/auth/linked?state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&nonce=${encodeURIComponent(nonce)}`;

/*  const facebookURL =
    `/auth/facebook?` +
    `state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&nonce=${encodeURIComponent(nonce)}`;

  const xURL =
    `/auth/x?` +
    `state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&nonce=${encodeURIComponent(nonce)}`;
*/

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginTop: "100px",
      gap: "20px"
    }}>
      <h2>Choose Login</h2>

      <a href={googleURL}>
        <button>
          🔵 Continue with Google
        </button>
      </a>

      <a href={linkedURL}>
        <button>
          💼 Continue with linkedIn
        </button>
      </a>

      <a href={xURL}>
        <button>
          𝕏 Continue with twitter
        </button>
      </a>
      
    </div>
  );
}