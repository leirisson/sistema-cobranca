export interface HasherSenha {
  hash(senha: string): Promise<string>;
  comparar(senha: string, hash: string): Promise<boolean>;
}
