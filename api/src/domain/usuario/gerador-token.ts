export interface GeradorToken {
  gerar(payload: { sub: string; email: string }): string;
}
