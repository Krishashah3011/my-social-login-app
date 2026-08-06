import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request: requestML }) => {
  const { shop: shopML, session: sessionML } = await authenticate.webhook(requestML);

  if (sessionML) {
    await db.session.deleteMany({ where: { shop: shopML } });
  }

  return new Response();
};