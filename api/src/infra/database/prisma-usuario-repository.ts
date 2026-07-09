import type { PrismaClient } from "@prisma/client";

import { Usuario } from "../../domain/usuario/usuario.js";
import type { UsuarioRepository } from "../../domain/usuario/usuario-repository.js";

export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const registro = await this.prisma.usuario.findUnique({ where: { email } });

    if (!registro) {
      return null;
    }

    return Usuario.restaurar({
      id: registro.id,
      email: registro.email,
      senhaHash: registro.senhaHash,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt,
    });
  }
}
