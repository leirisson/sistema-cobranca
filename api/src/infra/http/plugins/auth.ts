import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../../shared/config/env.js";
import { verificarToken } from "../../auth/jwt-verificador-token.js";

export async function autenticar(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return reply.status(401).send({ error: "Token de autenticação ausente" });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    verificarToken(token, env.JWT_SECRET);
  } catch {
    return reply.status(401).send({ error: "Token de autenticação inválido" });
  }
}
