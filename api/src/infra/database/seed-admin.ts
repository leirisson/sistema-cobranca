import { config } from "dotenv";

config();

import { Usuario } from "../../domain/usuario/usuario.js";
import { BcryptHasherSenha } from "../auth/bcrypt-hasher-senha.js";
import { prisma } from "./prisma-client.js";

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const senha = process.env.SEED_ADMIN_SENHA;

  if (!email || !senha) {
    console.error("Defina SEED_ADMIN_EMAIL e SEED_ADMIN_SENHA no ambiente antes de rodar.");
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

  console.log(`Super administrador ${email} criado/atualizado com sucesso.`);
  await prisma.$disconnect();
}

seedAdmin().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
