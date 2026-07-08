import type { PrismaClient, Cliente as ClientePrisma, TelefoneCliente as TelefoneClientePrisma } from "@prisma/client";

import { Cliente } from "../../domain/cliente/cliente.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";

type ClienteComTelefones = ClientePrisma & { telefones: TelefoneClientePrisma[] };

export class PrismaClienteRepository implements ClienteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async salvar(cliente: Cliente): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.cliente.upsert({
        where: { id: cliente.id },
        create: {
          id: cliente.id,
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          valorCobranca: cliente.valorCobranca,
          diaVencimento: cliente.diaVencimento,
          status: cliente.status,
          inscricaoEstadual: cliente.inscricaoEstadual,
          enderecoRua: cliente.endereco?.rua ?? null,
          enderecoNumero: cliente.endereco?.numero ?? null,
          enderecoBairro: cliente.endereco?.bairro ?? null,
          enderecoCidade: cliente.endereco?.cidade ?? null,
          enderecoUf: cliente.endereco?.uf ?? null,
          enderecoCep: cliente.endereco?.cep ?? null,
          nomeContato: cliente.nomeContato,
          referenciaServico: cliente.referenciaServico,
          createdAt: cliente.createdAt,
          updatedAt: cliente.updatedAt,
        },
        update: {
          nome: cliente.nome,
          documento: cliente.documento,
          email: cliente.email,
          valorCobranca: cliente.valorCobranca,
          diaVencimento: cliente.diaVencimento,
          status: cliente.status,
          inscricaoEstadual: cliente.inscricaoEstadual,
          enderecoRua: cliente.endereco?.rua ?? null,
          enderecoNumero: cliente.endereco?.numero ?? null,
          enderecoBairro: cliente.endereco?.bairro ?? null,
          enderecoCidade: cliente.endereco?.cidade ?? null,
          enderecoUf: cliente.endereco?.uf ?? null,
          enderecoCep: cliente.endereco?.cep ?? null,
          nomeContato: cliente.nomeContato,
          referenciaServico: cliente.referenciaServico,
          updatedAt: cliente.updatedAt,
        },
      });

      await tx.telefoneCliente.deleteMany({ where: { clienteId: cliente.id } });
      await tx.telefoneCliente.createMany({
        data: cliente.telefones.map((telefone) => ({
          clienteId: cliente.id,
          numero: telefone.numero,
          principal: telefone.principal,
        })),
      });
    });
  }

  async buscarPorId(id: string): Promise<Cliente | null> {
    const registro = await this.prisma.cliente.findUnique({
      where: { id },
      include: { telefones: true },
    });

    return registro ? this.paraEntidade(registro) : null;
  }

  async buscarPorNome(nome: string): Promise<Cliente[]> {
    const registros = await this.prisma.cliente.findMany({
      where: { nome: { contains: nome, mode: "insensitive" } },
      include: { telefones: true },
    });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  async listarAtivos(): Promise<Cliente[]> {
    const registros = await this.prisma.cliente.findMany({
      where: { status: "ATIVO" },
      include: { telefones: true },
    });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  private paraEntidade(registro: ClienteComTelefones): Cliente {
    const temEndereco = registro.enderecoRua !== null && registro.enderecoCidade !== null && registro.enderecoUf !== null && registro.enderecoCep !== null;

    return Cliente.restaurar({
      id: registro.id,
      nome: registro.nome,
      documento: registro.documento,
      telefones: registro.telefones.map((telefone) => ({
        id: telefone.id,
        numero: telefone.numero,
        principal: telefone.principal,
      })),
      email: registro.email,
      valorCobranca: registro.valorCobranca.toNumber(),
      diaVencimento: registro.diaVencimento,
      status: registro.status,
      inscricaoEstadual: registro.inscricaoEstadual,
      endereco: temEndereco
        ? {
            rua: registro.enderecoRua!,
            numero: registro.enderecoNumero,
            bairro: registro.enderecoBairro,
            cidade: registro.enderecoCidade!,
            uf: registro.enderecoUf!,
            cep: registro.enderecoCep!,
          }
        : null,
      nomeContato: registro.nomeContato,
      referenciaServico: registro.referenciaServico,
      createdAt: registro.createdAt,
      updatedAt: registro.updatedAt,
    });
  }
}
