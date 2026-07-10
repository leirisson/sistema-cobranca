"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import {
  buscarStatusWhatsappAction,
  conectarWhatsappAction,
  desconectarWhatsappAction,
} from "@/lib/configuracao/actions";

const INTERVALO_POLLING_MS = 3000;
const STATUS_CONECTADO = "open";

export function StatusWhatsapp() {
  const [status, setStatus] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregandoStatusInicial, setCarregandoStatusInicial] = useState(true);
  const [desconectando, setDesconectando] = useState(false);
  const [, startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function pararPolling() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function conectar() {
    setErro(null);
    startTransition(async () => {
      try {
        const resultado = await conectarWhatsappAction();
        setQrCodeBase64(resultado.qrCodeBase64);
        setStatus(resultado.status);
      } catch {
        setErro("Não foi possível conectar ao WhatsApp no momento.");
      }
    });
  }

  function desconectar() {
    setErro(null);
    setDesconectando(true);
    startTransition(async () => {
      try {
        await desconectarWhatsappAction();
        setStatus(null);
        setQrCodeBase64(null);
      } catch {
        setErro("Não foi possível desconectar o WhatsApp no momento.");
      } finally {
        setDesconectando(false);
      }
    });
  }

  useEffect(() => {
    startTransition(async () => {
      try {
        const resultado = await buscarStatusWhatsappAction();
        setStatus(resultado.status);
      } catch {
        setErro("Não foi possível consultar o status do WhatsApp.");
      } finally {
        setCarregandoStatusInicial(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!qrCodeBase64 || status === STATUS_CONECTADO) {
      pararPolling();
      return;
    }

    intervalRef.current = setInterval(() => {
      startTransition(async () => {
        try {
          const resultado = await buscarStatusWhatsappAction();
          setStatus(resultado.status);
          setErro(null);

          if (resultado.status === STATUS_CONECTADO) {
            setQrCodeBase64(null);
            pararPolling();
          }
        } catch {
          setErro("Não foi possível atualizar o status do WhatsApp.");
        }
      });
    }, INTERVALO_POLLING_MS);

    return () => pararPolling();
  }, [qrCodeBase64, status]);

  const conectado = status === STATUS_CONECTADO;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-linha bg-white p-6">
      <h2 className="font-display text-lg font-semibold text-grafite">WhatsApp</h2>

      {erro && (
        <p role="alert" className="text-sm text-carimbo-atrasado">
          {erro}
        </p>
      )}

      {!carregandoStatusInicial && (
        <p className="flex items-center gap-2 text-sm text-grafite-suave">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${conectado ? "bg-carimbo-pago" : "bg-carimbo-atrasado"}`}
            aria-hidden="true"
          />
          Status:{" "}
          <span className="font-medium text-grafite">{conectado ? "conectado" : (status ?? "desconectado")}</span>
        </p>
      )}

      {qrCodeBase64 && !conectado && (
        // eslint-disable-next-line @next/next/no-img-element -- QR Code é data: URI dinâmico, não uma imagem estática otimizável
        <img
          src={qrCodeBase64}
          alt="QR Code para conectar o WhatsApp"
          className="h-64 w-64 self-start rounded-md border border-linha"
        />
      )}

      {!carregandoStatusInicial && !conectado && (
        <button
          type="button"
          onClick={conectar}
          className="self-start rounded-md bg-tinta px-6 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          {qrCodeBase64 ? "Gerar novo QR Code" : "Conectar WhatsApp"}
        </button>
      )}

      {conectado && (
        <button
          type="button"
          onClick={desconectar}
          disabled={desconectando}
          className="self-start rounded-md border border-carimbo-atrasado px-6 py-3 text-base font-medium text-carimbo-atrasado transition-colors hover:bg-carimbo-atrasado/5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {desconectando ? "Desconectando..." : "Desconectar WhatsApp"}
        </button>
      )}
    </div>
  );
}
