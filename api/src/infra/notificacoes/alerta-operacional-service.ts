import type { CanalMensagem } from "../../domain/mensagem/canal-mensagem.js";
import type { CanalNotificacao } from "../../domain/mensagem/canal-notificacao.js";

export interface AlertaOperacionalInput {
  job: string;
  erro: Error;
}

export class AlertaOperacionalService {
  constructor(
    private readonly canalMensagem: CanalMensagem,
    private readonly canalNotificacao: CanalNotificacao,
    private readonly destino: string | undefined,
  ) {}

  async alertar(input: AlertaOperacionalInput): Promise<void> {
    if (!this.destino) {
      return;
    }

    const horario = new Date().toISOString();
    const texto = `[CobraCerta] O job "${input.job}" falhou em ${horario}.\nErro: ${input.erro.message}`;

    try {
      if (this.destino.includes("@")) {
        await this.canalNotificacao.enviarEmail({
          destinatario: this.destino,
          assunto: `[CobraCerta] Falha no job ${input.job}`,
          corpoHtml: texto.replace(/\n/g, "<br>"),
        });
      } else {
        await this.canalMensagem.enviarMensagem({ telefone: this.destino, texto });
      }
    } catch {
      // Alerta é best-effort (OBS-R-04) — a falha do job original já foi logada pelo listener.
    }
  }
}
