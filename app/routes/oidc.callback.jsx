import {SignJWT} from "jose";
import { getKeys } from "../utils/keys.server";


export async function createOIDCToken(user){

const {privateKey}=await getKeys();


return await new SignJWT({

email:user.email,

email_verified:true,

name:user.name

})

.setProtectedHeader({
alg:"RS256",
kid:"shopify-login-key"
})

.setIssuedAt()

.setIssuer(
process.env.OIDC_ISSUER
)

.setAudience(
"shopify"
)

.setSubject(
user.email
)

.setExpirationTime(
"5m"
)

.sign(privateKey);
}