import type { FastifyInstance } from "fastify";

import { LoginUseCase } from "../../../application/auth/login-use-case.js";
import { CredenciaisInvalidasError } from "../../../domain/usuario/credenciais-invalidas-error.js";
import { env } from "../../../shared/config/env.js";
import { BcryptHasherSenha } from "../../auth/bcrypt-hasher-senha.js";
import { JwtGeradorToken } from "../../auth/jwt-gerador-token.js";
import { PrismaUsuarioRepository } from "../../database/prisma-usuario-repository.js";
import { prisma } from "../../database/prisma-client.js";

interface LoginBody {
  email: string;
  senha: string;
}

export async function authRoutes(app: FastifyInstance) {
  const usuarioRepository = new PrismaUsuarioRepository(prisma);
  const hasherSenha = new BcryptHasherSenha();
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const useCase = new LoginUseCase(usuarioRepository, hasherSenha, geradorToken);

  app.post<{ Body: LoginBody }>(
    "/auth/login",
    {
      // SEC-01: limite mais agressivo que o geral (anti-brute-force), por IP.
      config: {
        rateLimit: {
          max: 5,
          timeWindow: "1 minute",
        },
      },
    },
    async (request, reply) => {
      const { email, senha } = request.body;

      try {
        const resultado = await useCase.executar({ email, senha });

        return reply.status(200).send(resultado);
      } catch (error) {
        if (error instanceof CredenciaisInvalidasError) {
          return reply.status(401).send({ error: "E-mail ou senha inválidos" });
        }

        throw error;
      }
    },
  );
}
