import Link from "next/link";

import type { MensagemComFalhaItem } from "@/lib/api/cobrancas";

const formatadorDataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const LABEL_TIPO: Record<MensagemComFalhaItem["tipo"], string> = {
  LEMBRETE: "Lembrete",
  VENCIMENTO: "Vencimento",
  ATRASO: "Atraso",
  CONFIRMACAO: "Confirmação",
};

const LABEL_CANAL: Record<MensagemComFalhaItem["canal"], string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

export function TabelaMensagensComFalha({ mensagens }: { mensagens: MensagemComFalhaItem[] }) {
  if (mensagens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="text-grafite">Nenhuma mensagem com falha de envio registrada.</p>
      </div>
    );
  }

  return (
    <table className="w-full min-w-[560px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-linha text-xs uppercase tracking-wide text-grafite-suave">
          <th className="px-4 py-3 font-medium">Cliente</th>
          <th className="px-4 py-3 font-medium">Tipo</th>
          <th className="px-4 py-3 font-medium">Canal</th>
          <th className="px-4 py-3 font-medium">Enviado em</th>
        </tr>
      </thead>
      <tbody>
        {mensagens.map((mensagem) => (
          <tr key={mensagem.id} className="border-b border-linha last:border-0">
            <td className="px-4 py-3 whitespace-nowrap text-grafite">
              <Link
                href={`/dashboard/cobrancas/${mensagem.cobrancaId}`}
                className="transition-colors hover:text-tinta hover:underline"
              >
                {mensagem.nomeCliente}
              </Link>
            </td>
            <td className="px-4 py-3 text-grafite">{LABEL_TIPO[mensagem.tipo]}</td>
            <td className="px-4 py-3 text-grafite">{LABEL_CANAL[mensagem.canal]}</td>
            <td className="px-4 py-3 font-numeric whitespace-nowrap text-grafite">
              {formatadorDataHora.format(new Date(mensagem.enviadoEm))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
