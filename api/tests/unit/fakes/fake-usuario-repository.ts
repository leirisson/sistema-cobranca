import type { Usuario } from "../../../src/domain/usuario/usuario.js";
import type { UsuarioRepository } from "../../../src/domain/usuario/usuario-repository.js";

export class FakeUsuarioRepository implements UsuarioRepository {
  readonly usuarios: Usuario[] = [];

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.usuarios.find((usuario) => usuario.email === email) ?? null;
  }
}
