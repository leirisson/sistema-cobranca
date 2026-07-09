export interface Cifrador {
  cifrar(textoPlano: string): string;
  decifrar(textoCifrado: string): string;
}
