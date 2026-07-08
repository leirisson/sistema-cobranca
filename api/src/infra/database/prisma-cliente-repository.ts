import type { PrismaClient, Cliente as ClientePrisma } from "@prisma/client";

import { Cliente } from "../../domain/cliente/cliente.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(cliente: Cliente): Promise<void> {
    await this.prisma.cliente.upsert({
      where: { id: cliente.id },
      create: {
        id: cliente.id,
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        documento: cliente.documento,
        valorCobranca: cliente.valorCobranca,
        diaVencimento: cliente.diaVencimento,
        status: cliente.status,
        createdAt: cliente.createdAt,
        updatedAt: cliente.updatedAt,
      },
      update: {
        nome: cliente.nome,
        telefone: cliente.telefone,
        email: cliente.email,
        documento: cliente.documento,
        valorCobranca: cliente.valorCobranca,
        diaVencimento: cliente.diaVencimento,
        status: cliente.status,
        updatedAt: cliente.updatedAt,
      },
    });
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const registro = await this.prisma.cliente.findUnique({ where: { id } });

    return registro ? this.paraEntidade(registro) : null;
  }

  async buscarPorNome(nome: string): Promise<Cliente[]> {
    const registros = await this.prisma.cliente.findMany({
      where: { nome: { contains: nome, mode: "insensitive" } },
    });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  async listarAtivos(): Promise<Cliente[]> {
    const registros = await this.prisma.cliente.findMany({ where: { status: "ATIVO" } });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  private paraEntidade(registro: ClientePrisma): Cliente {
    return Cliente.restaurar({
      id: registro.id,
      nome: registro.nome,
      telefone: registro.telefone,
      email: registro.email,
      documento: registro.documento,
      valorCobranca: registro.valorCobranca.toNumber(),
      diaVencimento: registro.diaVencimento,
      status: registro.status,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt,
    });
  }
}
