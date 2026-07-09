import { describe, expect, it } from "vitest";

import { CifradorAes256Gcm } from "../../../../src/infra/security/cifrador-aes-256-gcm.js";

const CHAVE_A = "a".repeat(64);
const CHAVE_B = "b".repeat(64);

describe("CifradorAes256Gcm", () => {
  it("decifra o que cifrou, devolvendo o texto original", () => {
    const cifrador = new CifradorAes256Gcm({ chave: CHAVE_A });

    const cifrado = cifrador.cifrar("chave-secreta-de-teste-123456");

    expect(cifrador.decifrar(cifrado)).toBe("chave-secreta-de-teste-123456");
  });

  it("gera saídas diferentes para o mesmo texto em chamadas distintas (IV aleatório)", () => {
    const cifrador = new CifradorAes256Gcm({ chave: CHAVE_A });

    const primeiraCifrada = cifrador.cifrar("mesmo-texto");
    const segundaCifrada = cifrador.cifrar("mesmo-texto");

    expect(primeiraCifrada).not.toBe(segundaCifrada);
  });

  it("lança erro ao decifrar uma string malformada", () => {
    const cifrador = new CifradorAes256Gcm({ chave: CHAVE_A });

    expect(() => cifrador.decifrar("nao-e-um-valor-cifrado-valido")).toThrow();
  });

  it("lança erro ao decifrar um valor cifrado com outra chave", () => {
    const cifradorA = new CifradorAes256Gcm({ chave: CHAVE_A });
    const cifradorB = new CifradorAes256Gcm({ chave: CHAVE_B });

    const cifradoComA = cifradorA.cifrar("dado-sensivel");

    expect(() => cifradorB.decifrar(cifradoComA)).toThrow();
  });
});
