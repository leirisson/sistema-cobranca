import type { Cifrador } from "../../../src/domain/configuracao/cifrador.js";

const PREFIXO = "cifrado:";

export class FakeCifrador implements Cifrador {
  cifrar(textoPlano: string): string {
    return `${PREFIXO}${textoPlano}`;
  }

  decifrar(textoCifrado: string): string {
    if (!textoCifrado.startsWith(PREFIXO)) {
      throw new Error("Valor não foi cifrado pelo FakeCifrador");
    }

    return textoCifrado.slice(PREFIXO.length);
  }
}
