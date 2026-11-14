import React, { useState, useEffect, useMemo } from 'react';
import { TicketDraw } from '../types/lottery';
import {
  extractGoogleDriveFileId,
  fetchReceiptImageViaAppsScript,
  getGoogleDriveViewerUrl,
  getReceiptImageCandidates
} from '../services/ticketPublishService';
import { storageService } from '../services/storage';
import {
  Trophy,
  Calendar,
  CheckCircle2,
  Eye,
  Sparkles,
  X,
  FileDown,
  FileText,
  ImageOff,
  ZoomIn,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

interface TicketCardProps {
  ticket: TicketDraw;
  googleAppsScriptUrl?: string;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, googleAppsScriptUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [proxyDataUrl, setProxyDataUrl] = useState<string | null>(null);
  const [isTryingProxy, setIsTryingProxy] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const imageCandidates = useMemo(
    () => getReceiptImageCandidates(ticket.receiptImageUrl),
    [ticket.receiptImageUrl]
  );
  const driveFileId = useMemo(
    () => extractGoogleDriveFileId(ticket.receiptImageUrl),
    [ticket.receiptImageUrl]
  );
  const viewerUrl = useMemo(
    () => getGoogleDriveViewerUrl(ticket.receiptImageUrl),
    [ticket.receiptImageUrl]
  );

  useEffect(() => {
    setCandidateIndex(0);
    setProxyDataUrl(null);
    setIsTryingProxy(false);
    setImageLoadFailed(false);
  }, [ticket.receiptImageUrl]);

  const activeImageSrc = proxyDataUrl || imageCandidates[candidateIndex] || '';

  const handleImageError = async () => {
    if (proxyDataUrl) {
      setImageLoadFailed(true);
      return;
    }

    const nextIdx = candidateIndex + 1;
    if (nextIdx < imageCandidates.length) {
      setCandidateIndex(nextIdx);
      return;
    }

    if (driveFileId && !isTryingProxy) {
      setIsTryingProxy(true);
      const endpoint = googleAppsScriptUrl || storageService.getSettings().googleAppsScriptUrl;
      const fetched = await fetchReceiptImageViaAppsScript(endpoint, driveFileId);
      setIsTryingProxy(false);
      if (fetched) {
        setProxyDataUrl(fetched);
        setImageLoadFailed(false);
        return;
      }
    }

    setImageLoadFailed(true);
  };

  const handleRetryImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCandidateIndex(0);
    setProxyDataUrl(null);
    setIsTryingProxy(false);
    setImageLoadFailed(false);
  };

  const isMatched = (num: number) => {
    return ticket.isScrutinized && ticket.winningNumbers?.includes(num);
  };

  const isComplementario = (num: number) => {
    return ticket.isScrutinized && ticket.complementario === num;
  };

  const formattedDate = new Date(ticket.drawDate).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasReceipt = Boolean(ticket.receiptImageUrl && ticket.receiptImageUrl.trim().length > 0);
  const isPdfReceipt = hasReceipt && ticket.receiptImageUrl.startsWith('data:application/pdf');

  const betTypeLabel =
    ticket.betType === 'MULTIPLE_5'
      ? 'Múltiple 5 Números (44 apuestas)'
      : ticket.betType === 'MULTIPLE_7'
      ? 'Múltiple 7 Números (7 apuestas)'
      : ticket.betType === 'MULTIPLE_8'
      ? 'Múltiple 8 Números (28 apuestas)'
      : ticket.betType === 'MULTIPLE_9'
      ? 'Múltiple 9 Números (84 apuestas)'
      : ticket.betType === 'MULTIPLE_10'
      ? 'Múltiple 10 Números (210 apuestas)'
      : `Combinación ${ticket.numbersPlayedCount} números`;

  return (
    <>
      <article className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
        {/* Ticket Header */}
        <div className="bg-[#0A2540] p-5 sm:p-6 text-white flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-sm uppercase font-extrabold tracking-wider text-[#FF6B00] block tabular-nums">
              Ciclo {ticket.cycleNumber} · Jornada {ticket.jornadaNumber}/10
            </span>
            <div className="flex items-center gap-2 mt-1.5">
              <Calendar className="w-5 h-5 text-slate-300 shrink-0" />
              <span className="text-base sm:text-lg font-bold text-white capitalize leading-snug">
                {formattedDate}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-sm text-slate-300 font-medium block">Presupuesto</span>
            <span className="text-2xl font-black text-white tabular-nums">
              {ticket.cost.toFixed(2)} €
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5 bg-white">
          {/* Apuesta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-200 text-base">
            <div>
              <span className="text-sm font-semibold text-slate-500 block">Tipo de Apuesta</span>
              <span className="font-extrabold text-[#0A2540]">{betTypeLabel}</span>
            </div>
            <div className="sm:text-right">
              <span className="text-sm font-semibold text-slate-500 block">Socios Activos</span>
              <span className="font-extrabold text-[#0A2540] tabular-nums">
                {ticket.activePlayersCount} (1 €/socio)
              </span>
            </div>
          </div>

          {/* Numbers Played Grid */}
          <div>
            <span className="text-base font-bold text-slate-700 block mb-3">
              Combinación Jugada Oficial
            </span>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {ticket.playedNumbers.map((num, idx) => {
                const matched = isMatched(num);
                const comp = isComplementario(num);
                return (
                  <span
                    key={`${num}-${idx}`}
                    className={`flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full font-extrabold text-lg sm:text-xl tabular-nums shadow-sm transition ${
                      matched
                        ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 scale-105'
                        : comp
                        ? 'bg-[#FF6B00] text-white ring-3 ring-orange-200'
                        : 'bg-[#0A2540] text-white'
                    }`}
                  >
                    {num < 10 ? `0${num}` : num}
                  </span>
                );
              })}

              {/* Reintegro */}
              <div className="flex items-center gap-2 pl-3 ml-1 border-l-2 border-slate-200">
                <span className="text-sm font-extrabold uppercase text-slate-500">Reint.</span>
                <span
                  className={`flex items-center justify-center w-12 h-12 rounded-2xl font-black text-lg sm:text-xl tabular-nums ${
                    ticket.isScrutinized && ticket.hasReintegro
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-200'
                      : 'bg-orange-50 text-[#FF6B00] border-2 border-[#FF6B00]'
                  }`}
                >
                  {ticket.playedReintegro}
                </span>
              </div>
            </div>

            {ticket.isScrutinized && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3.5 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  Acierto
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#FF6B00] inline-block" />
                  Complementario
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#0A2540] inline-block" />
                  No premiado
                </span>
              </div>
            )}
          </div>

          {/* Vista previa real del resguardo subido por el administrador */}
          {hasReceipt && !isPdfReceipt && (
            <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-3 text-left space-y-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="w-full flex items-center justify-between cursor-pointer"
                title="Pulsa para ampliar el resguardo real"
              >
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0A2540]">
                  Resguardo Real Subido por Administración
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF6B00]">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Ampliar
                </span>
              </button>

              {!imageLoadFailed && activeImageSrc ? (
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="w-full max-h-56 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-2 hover:border-[#0A2540] transition cursor-pointer"
                >
                  <img
                    src={activeImageSrc}
                    alt={`Resguardo oficial Jornada ${ticket.jornadaNumber}`}
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                    className="max-h-52 w-auto max-w-full object-contain"
                  />
                </button>
              ) : (
                <div className="w-full rounded-xl bg-white border border-dashed border-slate-300 p-4 text-center space-y-2.5">
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    La vista previa directa está bloqueada por tu navegador o pendiente de permisos en Drive.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleRetryImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-xs font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reintentar</span>
                    </button>
                    {viewerUrl && viewerUrl.startsWith('http') && (
                      <a
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A2540] text-white text-xs font-bold"
                      >
                        <span>Abrir en Drive</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF6B00]" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {hasReceipt && isPdfReceipt && (
            <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-8 h-8 text-rose-600 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-extrabold text-[#0A2540] block">
                    Resguardo PDF Oficial Adjunto
                  </span>
                  <span className="text-xs text-slate-600 block">
                    Documento oficial validado por administración
                  </span>
                </div>
              </div>
              <a
                href={ticket.receiptImageUrl}
                download={`Resguardo_Ciclo${ticket.cycleNumber}_J${ticket.jornadaNumber}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 min-h-[42px] rounded-xl bg-[#0A2540] text-white text-sm font-bold shrink-0"
              >
                <FileDown className="w-4 h-4 text-[#FF6B00]" />
                <span>PDF</span>
              </a>
            </div>
          )}

          {/* Official Scrutiny Results if scrutinized */}
          {ticket.isScrutinized ? (
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-base">
                <span className="font-extrabold text-[#0A2540] flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-[#FF6B00] shrink-0" />
                  Escrutinio Oficial SELAE
                </span>
                <span className="text-sm font-mono font-bold text-slate-700 tabular-nums">
                  {ticket.winningNumbers?.join(' - ')} (C: {ticket.complementario} · R: {ticket.reintegro})
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <div>
                  <span className="text-base text-slate-800 font-bold block">
                    {ticket.prizeCategory || 'Resultado'}
                  </span>
                  <span className="text-sm text-slate-600 font-medium">
                    Aciertos: <strong className="text-[#0A2540]">{ticket.hitsCount ?? 0}</strong>{' '}
                    {ticket.hasReintegro ? '+ Reintegro' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums block">
                    {ticket.totalPrize > 0 ? `+${ticket.totalPrize.toFixed(2)} €` : '0,00 €'}
                  </span>
                  <span className="text-sm font-semibold text-slate-600 block">
                    {ticket.prizeType === 'MENOR_BOLSA'
                      ? 'Añadido a Bolsa'
                      : ticket.prizeType === 'MAYOR_BANCO'
                      ? '¡Cobro en Banco!'
                      : 'Sin premio'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F4F6F9] border border-slate-200 p-4 text-base text-[#0A2540] flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-bold">
                <Sparkles className="w-5 h-5 text-[#FF6B00] shrink-0" />
                Sorteo pendiente · Publicación 20:35 h
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wide text-emerald-700">
                En Juego
              </span>
            </div>
          )}

          {/* Action to view sealed official ticket receipt */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full inline-flex items-center justify-center gap-2.5 min-h-[48px] px-4 rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-base font-bold text-white transition cursor-pointer shadow-xs"
          >
            <Eye className="w-5 h-5 text-[#FF6B00]" />
            <span>{hasReceipt ? 'Ver Resguardo Real Completo' : 'Ver Detalle del Resguardo'}</span>
          </button>
        </div>
      </article>

      {/* Modal: Real Uploaded Official Receipt */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-[#0A2540] px-5 py-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-serif font-black text-xl text-white">
                  Resguardo Oficial Sellado
                </h3>
                <p className="text-sm text-slate-300 font-medium tabular-nums">
                  Jornada {ticket.jornadaNumber}/10 · Ciclo {ticket.cycleNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                aria-label="Cerrar resguardo"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Real Receipt Viewer */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {hasReceipt ? (
                isPdfReceipt ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-6 text-center space-y-4">
                    <FileText className="w-14 h-14 text-rose-600 mx-auto" />
                    <div>
                      <p className="text-lg font-extrabold text-[#0A2540]">
                        Resguardo Oficial en PDF
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        Archivo oficial subido por la administración para la Jornada {ticket.jornadaNumber}.
                      </p>
                    </div>
                    <a
                      href={ticket.receiptImageUrl}
                      download={`Resguardo_Ciclo${ticket.cycleNumber}_J${ticket.jornadaNumber}.pdf`}
                      className="inline-flex items-center justify-center gap-2 px-5 min-h-[48px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white font-bold text-base"
                    >
                      <FileDown className="w-5 h-5" />
                      <span>Descargar Resguardo PDF</span>
                    </a>
                  </div>
                ) : !imageLoadFailed && activeImageSrc ? (
                  <div className="rounded-2xl border border-slate-200 bg-[#F4F6F9] p-3 flex flex-col items-center">
                    <img
                      src={activeImageSrc}
                      alt={`Resguardo sellado Jornada ${ticket.jornadaNumber}`}
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                      className="w-full h-auto max-h-[60vh] object-contain rounded-xl bg-white shadow-xs"
                    />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F4F6F9] p-6 text-center space-y-3">
                    <ImageOff className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-base font-bold text-[#0A2540]">
                      No se pudo mostrar la imagen directamente aquí
                    </p>
                    <p className="text-sm text-slate-600">
                      El archivo puede tener acceso restringido en Google Drive o estar bloqueado por tu navegador.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={handleRetryImage}
                        className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-xl border border-slate-300 bg-white text-[#0A2540] text-sm font-bold cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reintentar</span>
                      </button>
                      {viewerUrl && viewerUrl.startsWith('http') && (
                        <a
                          href={viewerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-xl bg-[#FF6B00] hover:bg-[#E55E00] text-white text-sm font-bold"
                        >
                          <span>Abrir Resguardo en Drive</span>
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-[#F4F6F9] p-6 text-center space-y-2">
                  <ImageOff className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-base font-bold text-[#0A2540]">
                    Sin imagen adjunta del boleto todavía
                  </p>
                  <p className="text-sm text-slate-600">
                    Cuando el administrador suba la fotografía o captura del resguardo oficial, aparecerá aquí íntegramente para todos los socios.
                  </p>
                </div>
              )}

              {/* Resumen verificado de la apuesta */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 text-sm sm:text-base">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-600 font-semibold">Combinación jugada:</span>
                  <span className="font-mono font-black text-[#0A2540] tabular-nums">
                    {ticket.playedNumbers.map(n => (n < 10 ? `0${n}` : n)).join(' · ')}
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-600 font-semibold">Reintegro / Importe:</span>
                  <span className="font-bold text-[#0A2540] tabular-nums">
                    [{ticket.playedReintegro}] · {ticket.cost.toFixed(2)} € ({ticket.activePlayersCount} socios)
                  </span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-slate-600 font-semibold">Fecha de sorteo:</span>
                  <span className="font-bold text-[#0A2540] capitalize">{formattedDate}</span>
                </div>
              </div>

              {ticket.isScrutinized && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-base text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    Escrutinio validado por SELAE
                  </div>
                  <div>
                    Premio adjudicado: <strong className="tabular-nums">{ticket.totalPrize.toFixed(2)} €</strong> ({ticket.prizeCategory})
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {hasReceipt && !isPdfReceipt && (activeImageSrc || viewerUrl) && (
                <a
                  href={activeImageSrc || viewerUrl}
                  target={activeImageSrc.startsWith('data:') ? undefined : '_blank'}
                  rel={activeImageSrc.startsWith('data:') ? undefined : 'noopener noreferrer'}
                  download={activeImageSrc.startsWith('data:') ? `Resguardo_Ciclo${ticket.cycleNumber}_J${ticket.jornadaNumber}.jpg` : undefined}
                  className="inline-flex items-center justify-center gap-2 px-4 min-h-[48px] rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-[#0A2540] font-bold text-base transition"
                >
                  <FileDown className="w-5 h-5 text-[#FF6B00]" />
                  <span>{activeImageSrc.startsWith('data:') ? 'Guardar Imagen' : 'Abrir / Guardar'}</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 sm:flex-none sm:ml-auto px-6 min-h-[48px] rounded-xl bg-[#0A2540] hover:bg-[#13375B] text-base font-bold text-white transition cursor-pointer"
              >
                Cerrar Resguardo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
