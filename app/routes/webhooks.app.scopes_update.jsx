import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request: requestML }) => {
  const { payload: payloadML, session: sessionML } = await authenticate.webhook(requestML);

  const currentML = payloadML.current;

  if (sessionML) {
    await db.session.update({
      where: {
        id: sessionML.id,
      },
      data: {
        scope: currentML.toString(),
      },
    });
  }

  return new Response();
};