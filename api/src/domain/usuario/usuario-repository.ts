import type { Usuario } from "./usuario.js";

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
}
