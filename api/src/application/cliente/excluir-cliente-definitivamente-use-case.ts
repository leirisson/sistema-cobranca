import { ClienteNaoEncontradoError } from "../../domain/cliente/cliente-nao-encontrado-error.js";
import type { ClienteRepository } from "../../domain/cliente/cliente-repository.js";
import type { CobrancaRepository } from "../../domain/cobranca/cobranca-repository.js";

const DOCUMENTO_ANONIMIZADO = "00000000000";
const TELEFONE_ANONIMIZADO = "+10000000000";

export type ResultadoExclusaoCliente = "REMOVIDO" | "ANONIMIZADO";

export class ExcluirClienteDefinitivamenteUseCase {
  constructor(
    private readonly clienteRepository: ClienteRepository,
    private readonly cobrancaRepository: CobrancaRepository,
  ) {}

  async executar(id: string): Promise<ResultadoExclusaoCliente> {
    const cliente = await this.clienteRepository.buscarPorId(id);

    if (!cliente) {
      throw new ClienteNaoEncontradoError(id);
    }

    const temCobrancaAssociada = await this.cobrancaRepository.existePorClienteId(id);

    if (!temCobrancaAssociada) {
      await this.clienteRepository.remover(id);
      return "REMOVIDO";
    }

    cliente.editar({
      nome: "Cliente removido",
      documento: DOCUMENTO_ANONIMIZADO,
      telefones: [{ numero: TELEFONE_ANONIMIZADO, principal: true }],
      email: null,
      inscricaoEstadual: null,
      endereco: null,
      nomeContato: null,
      referenciaServico: null,
    });

    await this.clienteRepository.salvar(cliente);

    return "ANONIMIZADO";
  }
}
