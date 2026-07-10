export const ID_CONFIGURACAO_DEFAULT = "default";

export interface ConfiguracaoProps {
  asaasApiKeyCifrada?: string | null;
  nomeRemetente?: string | null;
  mensagemCobrancaPersonalizada?: string | null;
  confirmacaoPagamentoHabilitada?: boolean;
  confirmacaoPagamentoConfiguradaPeloUsuario?: boolean;
}

export interface ConfiguracaoRestauracao {
  id: string;
  asaasApiKeyCifrada: string | null;
  nomeRemetente: string | null;
  mensagemCobrancaPersonalizada?: string | null;
  confirmacaoPagamentoHabilitada: boolean;
  confirmacaoPagamentoConfiguradaPeloUsuario: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Configuracao {
  readonly id: string;
  private _asaasApiKeyCifrada: string | null;
  private _nomeRemetente: string | null;
  private _mensagemCobrancaPersonalizada: string | null;
  private _confirmacaoPagamentoHabilitada: boolean;
  private _confirmacaoPagamentoConfiguradaPeloUsuario: boolean;
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(
    id: string,
    asaasApiKeyCifrada: string | null,
    nomeRemetente: string | null,
    mensagemCobrancaPersonalizada: string | null,
    confirmacaoPagamentoHabilitada: boolean,
    confirmacaoPagamentoConfiguradaPeloUsuario: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this._asaasApiKeyCifrada = asaasApiKeyCifrada;
    this._nomeRemetente = nomeRemetente;
    this._mensagemCobrancaPersonalizada = mensagemCobrancaPersonalizada;
    this._confirmacaoPagamentoHabilitada = confirmacaoPagamentoHabilitada;
    this._confirmacaoPagamentoConfiguradaPeloUsuario = confirmacaoPagamentoConfiguradaPeloUsuario;
    this.createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  static criar(props: ConfiguracaoProps): Configuracao {
    const agora = new Date();

    return new Configuracao(
      ID_CONFIGURACAO_DEFAULT,
      props.asaasApiKeyCifrada ?? null,
      props.nomeRemetente ?? null,
      props.mensagemCobrancaPersonalizada ?? null,
      props.confirmacaoPagamentoHabilitada ?? false,
      props.confirmacaoPagamentoConfiguradaPeloUsuario ?? false,
      agora,
      agora,
    );
  }

  static restaurar(props: ConfiguracaoRestauracao): Configuracao {
    return new Configuracao(
      props.id,
      props.asaasApiKeyCifrada,
      props.nomeRemetente,
      props.mensagemCobrancaPersonalizada ?? null,
      props.confirmacaoPagamentoHabilitada,
      props.confirmacaoPagamentoConfiguradaPeloUsuario,
      props.createdAt,
      props.updatedAt,
    );
  }

  atualizarAsaasApiKeyCifrada(valor: string | null): void {
    this._asaasApiKeyCifrada = valor;
    this._updatedAt = new Date();
  }

  atualizarNomeRemetente(valor: string | null): void {
    this._nomeRemetente = valor;
    this._updatedAt = new Date();
  }

  atualizarMensagemCobrancaPersonalizada(valor: string | null): void {
    this._mensagemCobrancaPersonalizada = valor;
    this._updatedAt = new Date();
  }

  atualizarConfirmacaoPagamentoHabilitada(valor: boolean): void {
    this._confirmacaoPagamentoHabilitada = valor;
    this._confirmacaoPagamentoConfiguradaPeloUsuario = true;
    this._updatedAt = new Date();
  }

  possuiAsaasApiKeyConfigurada(): boolean {
    return this._asaasApiKeyCifrada !== null;
  }

  get asaasApiKeyCifrada(): string | null {
    return this._asaasApiKeyCifrada;
  }

  get nomeRemetente(): string | null {
    return this._nomeRemetente;
  }

  get mensagemCobrancaPersonalizada(): string | null {
    return this._mensagemCobrancaPersonalizada;
  }

  get confirmacaoPagamentoHabilitada(): boolean {
    return this._confirmacaoPagamentoHabilitada;
  }

  get confirmacaoPagamentoConfiguradaPeloUsuario(): boolean {
    return this._confirmacaoPagamentoConfiguradaPeloUsuario;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
