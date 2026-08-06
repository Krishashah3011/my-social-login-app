import {SignJWT} from "jose";
import { getKeys } from "../utils/keys.server";


export async function createOIDCToken(userML){

const {privateKey: privateKeyML}=await getKeys();


return await new SignJWT({

email:userML.email,

email_verified:true,

name:userML.name

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
userML.email
)

.setExpirationTime(
"5m"
)

.sign(privateKeyML);
}