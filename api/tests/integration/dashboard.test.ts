import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FastifyInstance } from "fastify";

import { buildApp } from "../../src/infra/http/app.js";
import { Cliente } from "../../src/domain/cliente/cliente.js";
import { Cobranca } from "../../src/domain/cobranca/cobranca.js";
import { MensagemEnviada } from "../../src/domain/mensagem/mensagem-enviada.js";
import { env } from "../../src/shared/config/env.js";
import { prisma } from "../../src/infra/database/prisma-client.js";
import { PrismaClienteRepository } from "../../src/infra/database/prisma-cliente-repository.js";
import { PrismaCobrancaRepository } from "../../src/infra/database/prisma-cobranca-repository.js";
import { PrismaMensagemEnviadaRepository } from "../../src/infra/database/prisma-mensagem-enviada-repository.js";
import { JwtGeradorToken } from "../../src/infra/auth/jwt-gerador-token.js";

describe("GET /dashboard/cobrancas", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarClienteComCobranca(
    nome: string,
    vencimento: string,
    status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO",
    valor = 150,
  ) {
    const cliente = Cliente.criar({
      nome,
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: valor,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor,
      vencimento: new Date(vencimento),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
    });

    if (status === "PAGO") {
      cobranca.marcarComoPaga(new Date(vencimento));
    } else if (status === "ATRASADO") {
      cobranca.marcarComoAtrasada();
    } else if (status === "CANCELADO") {
      cobranca.cancelar();
    }

    await cobrancaRepository.salvar(cobranca);

    return cobranca;
  }

  it("rejeita requisição sem token com 401 (AUTH-04)", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard/cobrancas" });

    expect(response.statusCode).toBe(401);
  });

  it("lista cobranças do mês corrente por padrão (DASH-R-01)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-08-10", "PENDENTE");

    const response = await app.inject({ method: "GET", url: "/dashboard/cobrancas", headers: authHeader });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("Maria Silva");
    expect(body.itens[0].origem).toBe("RECORRENTE");
  });

  it("expõe origem AVULSA na listagem (AVULSA-07)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 300,
      vencimento: new Date("2026-07-15"),
      gatewayChargeId: `asaas_avulsa_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_avulsa_${cliente.id}`,
      origem: "AVULSA",
      descricao: "Serviço extra - troca de peça",
    });
    await cobrancaRepository.salvar(cobranca);

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens[0].origem).toBe("AVULSA");
  });

  it("filtra por status (DASH-R-02)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-07-12", "ATRASADO");

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026&status=ATRASADO",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("João Souza");
  });

  it("calcula totais por status (DASH-R-03)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE", 100);
    await criarClienteComCobranca("João Souza", "2026-07-12", "ATRASADO", 200);
    await criarClienteComCobranca("Ana Costa", "2026-07-15", "PAGO", 300);

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.totais).toEqual({ totalAReceber: 300, totalRecebido: 300, totalEmAtraso: 200 });
  });

  it("busca por nome do cliente, case-insensitive (DASH-R-04)", async () => {
    await criarClienteComCobranca("Maria Silva", "2026-07-10", "PENDENTE");
    await criarClienteComCobranca("João Souza", "2026-07-12", "PENDENTE");

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026&busca=maria",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.itens).toHaveLength(1);
    expect(body.itens[0].nomeCliente).toBe("Maria Silva");
  });

  it("retorna 400 para status inválido", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?status=INVALIDO",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
  });

  it("pagina cobranças via ?pagina=, mantendo os totais do mês inteiro", async () => {
    for (let i = 1; i <= 25; i++) {
      await criarClienteComCobranca(`Cliente ${String(i).padStart(2, "0")}`, "2026-07-10", "PENDENTE");
    }

    const paginaUm = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026",
      headers: authHeader,
    });
    const paginaDois = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas?mes=7&ano=2026&pagina=2",
      headers: authHeader,
    });

    expect(paginaUm.json().itens).toHaveLength(20);
    expect(paginaDois.json().itens).toHaveLength(5);
    expect(paginaDois.json().paginaAtual).toBe(2);
    expect(paginaUm.json().totais.totalAReceber).toBe(paginaDois.json().totais.totalAReceber);
  });
});

describe("GET /dashboard/indicadores", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarClienteComCobranca(
    nome: string,
    vencimento: string,
    status: "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO",
    valor = 150,
    origem: "RECORRENTE" | "AVULSA" = "RECORRENTE",
  ) {
    const cliente = Cliente.criar({
      nome,
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: valor,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor,
      vencimento: new Date(vencimento),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
      origem,
    });

    if (status === "PAGO") {
      cobranca.marcarComoPaga(new Date(vencimento));
    } else if (status === "ATRASADO") {
      cobranca.marcarComoAtrasada();
    } else if (status === "CANCELADO") {
      cobranca.cancelar();
    }

    await cobrancaRepository.salvar(cobranca);

    return cobranca;
  }

  it("rejeita requisição sem token com 401", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard/indicadores" });

    expect(response.statusCode).toBe(401);
  });

  it("calcula indicadores mesmo com mais de 20 cobranças no mês (não depende da paginação)", async () => {
    for (let i = 1; i <= 25; i++) {
      await criarClienteComCobranca(`Cliente ${i}`, "2026-07-10", i <= 10 ? "PAGO" : "PENDENTE", 100);
    }
    await criarClienteComCobranca("Cliente Avulso", "2026-07-15", "PENDENTE", 300, "AVULSA");

    const response = await app.inject({
      method: "GET",
      url: "/dashboard/indicadores?mes=7&ano=2026",
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.totalGeradas).toBe(26);
    expect(body.totalPagas).toBe(10);
    expect(body.totalAvulsas).toBe(1);
  });
});

describe("GET /dashboard/cobrancas/:id", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("rejeita requisição sem token com 401 (AUTH-04)", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard/cobrancas/qualquer-id" });

    expect(response.statusCode).toBe(401);
  });

  it("retorna 404 quando a cobrança não existe", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/dashboard/cobrancas/inexistente",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(404);
  });

  it("retorna cliente, valor, status, link de pagamento, pix e histórico de mensagens (FE-DASH-R-04)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-07-10"),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
      pixCopiaECola: "00020126...",
    });
    await cobrancaRepository.salvar(cobranca);

    const mensagem = MensagemEnviada.criar({ cobrancaId: cobranca.id, tipo: "LEMBRETE", statusEnvio: "ENVIADO", canal: "whatsapp" });
    await new PrismaMensagemEnviadaRepository(prisma).salvar(mensagem);

    const response = await app.inject({
      method: "GET",
      url: `/dashboard/cobrancas/${cobranca.id}`,
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.nomeCliente).toBe("Maria Silva");
    expect(body.valor).toBe(150);
    expect(body.status).toBe("PENDENTE");
    expect(body.linkPagamento).toBe(`https://sandbox.asaas.com/i/asaas_${cliente.id}`);
    expect(body.pixCopiaECola).toBe("00020126...");
    expect(body.mensagens).toHaveLength(1);
    expect(body.mensagens[0]).toMatchObject({ tipo: "LEMBRETE", canal: "whatsapp", statusEnvio: "ENVIADO" });
    expect(body.origem).toBe("RECORRENTE");
    expect(body.descricao).toBeNull();
  });

  it("expõe origem AVULSA e descrição no detalhe de uma cobrança avulsa (AVULSA-R-04)", async () => {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 300,
      vencimento: new Date("2026-07-15"),
      gatewayChargeId: `asaas_avulsa_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_avulsa_${cliente.id}`,
      origem: "AVULSA",
      descricao: "Serviço extra - troca de peça",
    });
    await cobrancaRepository.salvar(cobranca);

    const response = await app.inject({
      method: "GET",
      url: `/dashboard/cobrancas/${cobranca.id}`,
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.origem).toBe("AVULSA");
    expect(body.descricao).toBe("Serviço extra - troca de peça");
  });
});

describe("POST /dashboard/cobrancas/:id/mensagens/:mensagemId/reenviar", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const mensagemEnviadaRepository = new PrismaMensagemEnviadaRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };
  const fetchOriginal = global.fetch;

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    global.fetch = fetchOriginal;
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function criarClienteCobrancaEMensagemFalha(status: "PENDENTE" | "PAGO" | "CANCELADO" = "PENDENTE") {
    const cliente = Cliente.criar({
      nome: "Maria Silva",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-08-10"),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
    });

    if (status === "PAGO") {
      cobranca.marcarComoPaga(new Date());
    } else if (status === "CANCELADO") {
      cobranca.cancelar();
    }

    await cobrancaRepository.salvar(cobranca);

    const mensagem = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio: "FALHA",
      canal: "whatsapp",
    });
    await mensagemEnviadaRepository.salvar(mensagem);

    return { cobranca, mensagem };
  }

  it("rejeita requisição sem token com 401", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/dashboard/cobrancas/qualquer-id/mensagens/qualquer-id/reenviar",
    });

    expect(response.statusCode).toBe(401);
  });

  it("reenvia mensagem FALHA e registra novo histórico (REENVIO-R-01)", async () => {
    const { cobranca, mensagem } = await criarClienteCobrancaEMensagemFalha();
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

    const response = await app.inject({
      method: "POST",
      url: `/dashboard/cobrancas/${cobranca.id}/mensagens/${mensagem.id}/reenviar`,
      headers: authHeader,
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.mensagens).toHaveLength(2);
    expect(body.mensagens.filter((m: { statusEnvio: string }) => m.statusEnvio === "ENVIADO")).toHaveLength(1);
    expect(body.mensagens.filter((m: { statusEnvio: string }) => m.statusEnvio === "FALHA")).toHaveLength(1);
  });

  it("retorna 404 quando a mensagem não existe", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/dashboard/cobrancas/qualquer-id/mensagens/inexistente/reenviar",
      headers: authHeader,
    });

    expect(response.statusCode).toBe(404);
  });

  it("retorna 400 ao reenviar mensagem de cobrança PAGO (REENVIO-R-04)", async () => {
    const { cobranca, mensagem } = await criarClienteCobrancaEMensagemFalha("PAGO");

    const response = await app.inject({
      method: "POST",
      url: `/dashboard/cobrancas/${cobranca.id}/mensagens/${mensagem.id}/reenviar`,
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
  });

  it("retorna 400 ao reenviar mensagem de cobrança CANCELADO (REENVIO-R-04)", async () => {
    const { cobranca, mensagem } = await criarClienteCobrancaEMensagemFalha("CANCELADO");

    const response = await app.inject({
      method: "POST",
      url: `/dashboard/cobrancas/${cobranca.id}/mensagens/${mensagem.id}/reenviar`,
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
  });

  it("retorna 400 ao reenviar mensagem que não está com statusEnvio FALHA", async () => {
    const { cobranca, mensagem: mensagemFalha } = await criarClienteCobrancaEMensagemFalha();
    const mensagemEnviada = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio: "ENVIADO",
      canal: "whatsapp",
    });
    await mensagemEnviadaRepository.salvar(mensagemEnviada);

    const response = await app.inject({
      method: "POST",
      url: `/dashboard/cobrancas/${cobranca.id}/mensagens/${mensagemEnviada.id}/reenviar`,
      headers: authHeader,
    });

    expect(response.statusCode).toBe(400);
    expect(mensagemFalha.statusEnvio).toBe("FALHA");
  });
});

describe("GET /dashboard/erros", () => {
  let app: FastifyInstance;
  const clienteRepository = new PrismaClienteRepository(prisma);
  const cobrancaRepository = new PrismaCobrancaRepository(prisma);
  const geradorToken = new JwtGeradorToken({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN });
  const token = geradorToken.gerar({ sub: "usuario-teste", email: "dono@cobracerta.com" });
  const authHeader = { authorization: `Bearer ${token}` };

  beforeAll(async () => {
    await prisma.$connect();
    app = buildApp();
    await app.ready();
  });

  afterEach(async () => {
    await prisma.erroGeracaoCobranca.deleteMany();
    await prisma.mensagemEnviada.deleteMany();
    await prisma.cobranca.deleteMany();
    await prisma.telefoneCliente.deleteMany();
    await prisma.cliente.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("rejeita requisição sem token com 401 (AUTH-04)", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard/erros" });

    expect(response.statusCode).toBe(401);
  });

  it("expõe erros de geração de cobrança e mensagens com FALHA (COB-05, MSG-05)", async () => {
    await prisma.erroGeracaoCobranca.create({
      data: {
        id: "erro-1",
        clienteId: "cliente-inexistente",
        nomeCliente: "Maria Silva",
        mensagemErro: "Falha ao criar cobrança no Asaas: timeout",
      },
    });

    const cliente = Cliente.criar({
      nome: "João Souza",
      documento: "12345678900",
      telefones: [{ numero: "+5511999998888", principal: true }],
      valorCobranca: 150,
      diaVencimento: 10,
    });
    await clienteRepository.salvar(cliente);

    const cobranca = Cobranca.criar({
      clienteId: cliente.id,
      valor: 150,
      vencimento: new Date("2026-07-10"),
      gatewayChargeId: `asaas_${cliente.id}`,
      linkPagamento: `https://sandbox.asaas.com/i/asaas_${cliente.id}`,
    });
    await cobrancaRepository.salvar(cobranca);

    const mensagemFalha = MensagemEnviada.criar({
      cobrancaId: cobranca.id,
      tipo: "LEMBRETE",
      statusEnvio: "FALHA",
      canal: "whatsapp",
    });
    await new PrismaMensagemEnviadaRepository(prisma).salvar(mensagemFalha);

    const response = await app.inject({ method: "GET", url: "/dashboard/erros", headers: authHeader });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errosGeracaoCobranca.itens).toHaveLength(1);
    expect(body.errosGeracaoCobranca.itens[0]).toMatchObject({
      nomeCliente: "Maria Silva",
      mensagemErro: "Falha ao criar cobrança no Asaas: timeout",
    });
    expect(body.mensagensComFalha.itens).toHaveLength(1);
    expect(body.mensagensComFalha.itens[0]).toMatchObject({
      nomeCliente: "João Souza",
      tipo: "LEMBRETE",
      canal: "whatsapp",
    });
  });

  it("devolve listas vazias quando não há nenhuma falha registrada", async () => {
    const response = await app.inject({ method: "GET", url: "/dashboard/erros", headers: authHeader });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.errosGeracaoCobranca.itens).toEqual([]);
    expect(body.mensagensComFalha.itens).toEqual([]);
  });

  it("pagina erros de geração de cobrança via ?paginaErros=", async () => {
    for (let i = 1; i <= 25; i++) {
      await prisma.erroGeracaoCobranca.create({
        data: {
          id: `erro-${i}`,
          clienteId: "cliente-inexistente",
          nomeCliente: `Cliente ${i}`,
          mensagemErro: "timeout",
        },
      });
    }

    const paginaUm = await app.inject({ method: "GET", url: "/dashboard/erros", headers: authHeader });
    const paginaDois = await app.inject({
      method: "GET",
      url: "/dashboard/erros?paginaErros=2",
      headers: authHeader,
    });

    expect(paginaUm.json().errosGeracaoCobranca.itens).toHaveLength(20);
    expect(paginaDois.json().errosGeracaoCobranca.itens).toHaveLength(5);
    expect(paginaDois.json().errosGeracaoCobranca.paginaAtual).toBe(2);
  });
});
