import type { Prisma, PrismaClient, Cliente as ClientePrisma, TelefoneCliente as TelefoneClientePrisma } from "@prisma/client";

import { Cliente, type StatusCliente } from "../../domain/cliente/cliente.js";
import type { ClienteRepository, PaginacaoInput, ResultadoPaginado } from "../../domain/cliente/cliente-repository.js";

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

  async listarTodos(): Promise<Cliente[]> {
    const registros = await this.prisma.cliente.findMany({
      include: { telefones: true },
    });

    return registros.map((registro) => this.paraEntidade(registro));
  }

  async listarPaginado(
    filtro: { busca?: string; status?: StatusCliente },
    paginacao: PaginacaoInput,
  ): Promise<ResultadoPaginado<Cliente>> {
    const where: Prisma.ClienteWhereInput = {
      ...(filtro.busca ? { nome: { contains: filtro.busca, mode: "insensitive" } } : {}),
      ...(filtro.status ? { status: filtro.status } : {}),
    };

    const [registros, totalItens] = await Promise.all([
      this.prisma.cliente.findMany({
        where,
        include: { telefones: true },
        orderBy: { nome: "asc" },
        skip: (paginacao.pagina - 1) * paginacao.itensPorPagina,
        take: paginacao.itensPorPagina,
      }),
      this.prisma.cliente.count({ where }),
    ]);

    return {
      itens: registros.map((registro) => this.paraEntidade(registro)),
      paginaAtual: paginacao.pagina,
      totalPaginas: Math.max(1, Math.ceil(totalItens / paginacao.itensPorPagina)),
      totalItens,
    };
  }

  async remover(id: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.telefoneCliente.deleteMany({ where: { clienteId: id } }),
      this.prisma.cliente.delete({ where: { id } }),
    ]);
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
