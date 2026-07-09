import { config } from "dotenv";

config();

import { Usuario } from "../../domain/usuario/usuario.js";
import { BcryptHasherSenha } from "../auth/bcrypt-hasher-senha.js";
import { prisma } from "./prisma-client.js";

async function seedUsuario() {
  const email = process.argv[2] ?? process.env.SEED_USUARIO_EMAIL;
  const senha = process.argv[3] ?? process.env.SEED_USUARIO_SENHA;

  if (!email || !senha) {
    console.error("Uso: tsx src/infra/database/seed-usuario.ts <email> <senha>");
    console.error("(ou defina SEED_USUARIO_EMAIL / SEED_USUARIO_SENHA no ambiente)");
    process.exit(1);
  }

  const hasherSenha = new BcryptHasherSenha();
  const senhaHash = await hasherSenha.hash(senha);
  const usuario = Usuario.criar({ email, senhaHash });

  await prisma.usuario.upsert({
    where: { email: usuario.email },
    create: {
      id: usuario.id,
      email: usuario.email,
      senhaHash: usuario.senhaHash,
    },
    update: {
      senhaHash: usuario.senhaHash,
    },
  });

  console.log(`Usuário ${email} criado/atualizado com sucesso.`);
  await prisma.$disconnect();
}

seedUsuario().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
