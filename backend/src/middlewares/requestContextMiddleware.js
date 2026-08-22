import { randomUUID } from "node:crypto";

export function requestContextMiddleware(req, res, next) {
  const incoming = req.headers["x-request-id"];
  req.requestId = incoming && String(incoming).trim() ? String(incoming).trim().slice(0, 200) : randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export default requestContextMiddleware;