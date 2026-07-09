import Link from "next/link";
import type { Metadata } from "next";

import { StatusBadgeCobranca } from "@/components/status-badge-cobranca";
import { buscarCobrancaDetalhe, type CanalNotificacao, type TipoMensagem } from "@/lib/api/cobrancas";

export const metadata: Metadata = {
  title: "Detalhe da cobrança — CobraCerta",
};

interface DetalheCobrancaPageProps {
  params: Promise<{ id: string }>;
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const LABEL_TIPO: Record<TipoMensagem, string> = {
  LEMBRETE: "Lembrete",
  VENCIMENTO: "Vencimento",
  ATRASO: "Atraso",
  CONFIRMACAO: "Confirmação de pagamento",
};

const LABEL_CANAL: Record<CanalNotificacao, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

export default async function DetalheCobrancaPage({ params }: DetalheCobrancaPageProps) {
  const { id } = await params;
  const cobranca = await buscarCobrancaDetalhe(id);

  if (!cobranca) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-xl font-semibold text-grafite">Cobrança não encontrada</h1>
        <Link href="/dashboard" className="text-sm font-medium text-tinta hover:underline">
          Voltar para o painel
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href="/dashboard" className="text-sm text-grafite-suave hover:text-tinta">
          ← Voltar para o painel
        </Link>
      </div>

      <div className="rounded-md border border-linha bg-white p-6 shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-grafite">{cobranca.nomeCliente}</h1>
            <p className="mt-1 font-numeric text-sm text-grafite-suave">
              Vencimento em {formatadorData.format(new Date(cobranca.vencimento))}
            </p>
            {cobranca.origem === "AVULSA" && (
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-grafite-suave">
                Cobrança avulsa
              </p>
            )}
          </div>
          <StatusBadgeCobranca status={cobranca.status} />
        </div>

        <p className="mt-6 font-display text-3xl font-medium tabular-nums text-grafite">
          {formatadorMoeda.format(cobranca.valor)}
        </p>

        {cobranca.descricao && <p className="mt-2 text-sm text-grafite-suave">{cobranca.descricao}</p>}

        {(cobranca.linkPagamento || cobranca.pixCopiaECola) && (
          <div className="mt-6 flex flex-col gap-3 border-t border-linha pt-6">
            {cobranca.linkPagamento && (
              <a
                href={cobranca.linkPagamento}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-md bg-tinta px-4 py-2.5 text-sm font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
              >
                Abrir link de pagamento
              </a>
            )}

            {cobranca.pixCopiaECola && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-grafite-suave">Pix copia-e-cola</p>
                <p className="mt-1 break-all rounded-md border border-linha bg-papel px-3 py-2 font-numeric text-xs text-grafite">
                  {cobranca.pixCopiaECola}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-linha bg-white p-6 shadow-[0_4px_16px_-4px_rgba(28,35,33,0.12)]">
        <h2 className="font-display text-lg font-semibold text-grafite">Histórico de mensagens</h2>

        {cobranca.mensagens.length === 0 ? (
          <p className="mt-4 text-sm text-grafite-suave">Nenhuma mensagem enviada para esta cobrança ainda.</p>
        ) : (
          <ul className="mt-4 flex flex-col divide-y divide-linha">
            {cobranca.mensagens.map((mensagem) => (
              <li key={mensagem.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm text-grafite">
                    {LABEL_TIPO[mensagem.tipo]} · {LABEL_CANAL[mensagem.canal]}
                  </p>
                  <p className="mt-0.5 font-numeric text-xs text-grafite-suave">
                    {formatadorDataHora.format(new Date(mensagem.enviadoEm))}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium uppercase tracking-wide ${
                    mensagem.statusEnvio === "ENVIADO" ? "text-carimbo-pago" : "text-carimbo-atrasado"
                  }`}
                >
                  {mensagem.statusEnvio === "ENVIADO" ? "Enviado" : "Falha"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
