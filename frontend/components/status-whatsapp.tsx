"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { buscarStatusWhatsappAction, conectarWhatsappAction } from "@/lib/configuracao/actions";

const INTERVALO_POLLING_MS = 3000;
const STATUS_CONECTADO = "open";

export function StatusWhatsapp() {
  const [status, setStatus] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
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

      {status && (
        <p className="text-sm text-grafite-suave">
          Status: <span className="font-medium text-grafite">{conectado ? "conectado" : status}</span>
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

      {!conectado && (
        <button
          type="button"
          onClick={conectar}
          className="self-start rounded-md bg-tinta px-6 py-3 text-base font-medium text-papel transition-colors hover:bg-[var(--tinta-hover)]"
        >
          {qrCodeBase64 ? "Gerar novo QR Code" : "Conectar WhatsApp"}
        </button>
      )}
    </div>
  );
}
