import type { FastifyInstance } from "fastify";

import { CriarClienteUseCase } from "../../../application/cliente/criar-cliente-use-case.js";
import { EditarClienteUseCase } from "../../../application/cliente/editar-cliente-use-case.js";
import { InativarClienteUseCase } from "../../../application/cliente/inativar-cliente-use-case.js";
import { ListarClientesUseCase } from "../../../application/cliente/listar-clientes-use-case.js";
import { ReativarClienteUseCase } from "../../../application/cliente/reativar-cliente-use-case.js";
import type { Cliente, ClienteProps, ClienteEdicao, StatusCliente } from "../../../domain/cliente/cliente.js";
import { ClienteInvalidoError } from "../../../domain/cliente/cliente-invalido-error.js";
import { ClienteNaoEncontradoError } from "../../../domain/cliente/cliente-nao-encontrado-error.js";
import { PrismaClienteRepository } from "../../database/prisma-cliente-repository.js";
import { prisma } from "../../database/prisma-client.js";
import { autenticar } from "../plugins/auth.js";

const STATUS_VALIDOS: StatusCliente[] = ["ATIVO", "INATIVO"];

interface ListarQuerystring {
  busca?: string;
  status?: string;
}

interface StatusBody {
  status: string;
}

function paraDTO(cliente: Cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    documento: cliente.documento,
    tipoDocumento: cliente.tipoDocumento,
    telefones: cliente.telefones,
    email: cliente.email,
    valorCobranca: cliente.valorCobranca,
    diaVencimento: cliente.diaVencimento,
    status: cliente.status,
    inscricaoEstadual: cliente.inscricaoEstadual,
    endereco: cliente.endereco,
    nomeContato: cliente.nomeContato,
    referenciaServico: cliente.referenciaServico,
    createdAt: cliente.createdAt,
    updatedAt: cliente.updatedAt,
  };
}

export async function clientesRoutes(app: FastifyInstance) {
  const clienteRepository = new PrismaClienteRepository(prisma);
  const listarClientesUseCase = new ListarClientesUseCase(clienteRepository);
  const criarClienteUseCase = new CriarClienteUseCase(clienteRepository);
  const editarClienteUseCase = new EditarClienteUseCase(clienteRepository);
  const inativarClienteUseCase = new InativarClienteUseCase(clienteRepository);
  const reativarClienteUseCase = new ReativarClienteUseCase(clienteRepository);

  app.addHook("preHandler", autenticar);

  app.get<{ Querystring: ListarQuerystring }>("/clientes", async (request, reply) => {
    const { busca, status } = request.query;

    if (status && !STATUS_VALIDOS.includes(status as StatusCliente)) {
      return reply.status(400).send({ error: "Status inválido" });
    }

    const clientes = await listarClientesUseCase.executar({
      busca,
      status: status as StatusCliente | undefined,
    });

    return reply.status(200).send(clientes.map(paraDTO));
  });

  app.get<{ Params: { id: string } }>("/clientes/:id", async (request, reply) => {
    const cliente = await clienteRepository.buscarPorId(request.params.id);

    if (!cliente) {
      return reply.status(404).send({ error: "Cliente não encontrado" });
    }

    return reply.status(200).send(paraDTO(cliente));
  });

  app.post<{ Body: ClienteProps }>("/clientes", async (request, reply) => {
    try {
      const cliente = await criarClienteUseCase.executar(request.body);

      return reply.status(201).send(paraDTO(cliente));
    } catch (error) {
      if (error instanceof ClienteInvalidoError) {
        return reply.status(400).send({ error: error.message });
      }

      throw error;
    }
  });

  app.put<{ Params: { id: string }; Body: ClienteEdicao }>("/clientes/:id", async (request, reply) => {
    try {
      const cliente = await editarClienteUseCase.executar(request.params.id, request.body);

      return reply.status(200).send(paraDTO(cliente));
    } catch (error) {
      if (error instanceof ClienteNaoEncontradoError) {
        return reply.status(404).send({ error: error.message });
      }

      if (error instanceof ClienteInvalidoError) {
        return reply.status(400).send({ error: error.message });
      }

      throw error;
    }
  });

  app.patch<{ Params: { id: string }; Body: StatusBody }>("/clientes/:id/status", async (request, reply) => {
    const { status } = request.body;

    if (!STATUS_VALIDOS.includes(status as StatusCliente)) {
      return reply.status(400).send({ error: "Status inválido" });
    }

    try {
      if (status === "ATIVO") {
        await reativarClienteUseCase.executar(request.params.id);
      } else {
        await inativarClienteUseCase.executar(request.params.id);
      }

      const cliente = await clienteRepository.buscarPorId(request.params.id);

      return reply.status(200).send(paraDTO(cliente!));
    } catch (error) {
      if (error instanceof ClienteNaoEncontradoError) {
        return reply.status(404).send({ error: error.message });
      }

      throw error;
    }
  });
}
