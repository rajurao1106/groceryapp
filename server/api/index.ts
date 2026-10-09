import type { IncomingMessage, ServerResponse } from "node:http";
import { buildApp } from "../src/app.js";

const appPromise = buildApp().then(async (app) => {
  await app.ready();
  return app;
});

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const rewrittenUrl = new URL(request.url ?? "/", "http://vercel.local");
  const originalPath = rewrittenUrl.searchParams.get("__route");

  if (originalPath) {
    rewrittenUrl.searchParams.delete("__route");
    request.url = `${originalPath}${rewrittenUrl.search}`;
  }

  const app = await appPromise;
  await new Promise<void>((resolve, reject) => {
    response.once("finish", resolve);
    response.once("error", reject);
    app.server.emit("request", request, response);
  });
}
