import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { Cifrador } from "../../domain/configuracao/cifrador.js";

const ALGORITMO = "aes-256-gcm";
const TAMANHO_IV_BYTES = 12;

export interface CifradorAes256GcmConfig {
  chave: string;
}

export class CifradorAes256Gcm implements Cifrador {
  private readonly chave: Buffer;

  constructor(config: CifradorAes256GcmConfig) {
    this.chave = Buffer.from(config.chave, "hex");
  }

  cifrar(textoPlano: string): string {
    const iv = randomBytes(TAMANHO_IV_BYTES);
    const cipher = createCipheriv(ALGORITMO, this.chave, iv);

    const ciphertext = Buffer.concat([cipher.update(textoPlano, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString("hex"), authTag.toString("hex"), ciphertext.toString("hex")].join(":");
  }

  decifrar(textoCifrado: string): string {
    const partes = textoCifrado.split(":");

    if (partes.length !== 3) {
      throw new Error("Valor cifrado em formato inválido");
    }

    const [ivHex, authTagHex, ciphertextHex] = partes;
    const iv = Buffer.from(ivHex!, "hex");
    const authTag = Buffer.from(authTagHex!, "hex");
    const ciphertext = Buffer.from(ciphertextHex!, "hex");

    const decipher = createDecipheriv(ALGORITMO, this.chave, iv);
    decipher.setAuthTag(authTag);

    const textoPlano = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return textoPlano.toString("utf8");
  }
}
