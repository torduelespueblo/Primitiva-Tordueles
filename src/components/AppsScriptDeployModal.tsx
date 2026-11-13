import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code2, Server, HelpCircle, X, FileCode } from 'lucide-react';
import webAppGsContent from '../../google-apps-script/WebApp.gs?raw';
import indexHtmlContent from '../../google-apps-script/Index.html?raw';
import estilosHtmlContent from '../../google-apps-script/Estilos.html?raw';
import logicaHtmlContent from '../../google-apps-script/Logica.html?raw';
import codeGsContent from '../../google-apps-script/Code.gs?raw';

interface AppsScriptDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  appsScriptUrl: string;
  onSaveUrl: (url: string) => void;
}

export const AppsScriptDeployModal: React.FC<AppsScriptDeployModalProps> = ({
  isOpen,
  onClose,
  appsScriptUrl,
  onSaveUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [urlInput, setUrlInput] = useState(appsScriptUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<'WebApp.gs' | 'Index.html' | 'Estilos.html' | 'Logica.html' | 'Code.gs'>('WebApp.gs');

  if (!isOpen) return null;

  const filesContent: Record<string, string> = {
    'WebApp.gs': webAppGsContent,
    'Index.html': indexHtmlContent,
    'Estilos.html': estilosHtmlContent,
    'Logica.html': logicaHtmlContent,
    'Code.gs': codeGsContent,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(filesContent[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSave = () => {
    let clean = (urlInput || '').trim();
    if (clean.endsWith('/exe')) {
      clean = clean + 'c';
    }
    setUrlInput(clean);
    onSaveUrl(clean);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getCleanUrl = () => {
    let clean = (urlInput || '').trim();
    if (clean.endsWith('/exe')) {
      clean = clean + 'c';
    }
    return clean;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#0A2540] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <Server className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base font-serif">Google Apps Script (HtmlService & Backend)</h3>
              <p className="text-xs text-slate-300">Archivos oficiales listos para copiar y desplegar en GAS</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-700">
          {/* File selector pills */}
          <div>
            <span className="block font-bold text-xs text-[#0A2540] mb-2">Selecciona el archivo para copiar a Apps Script:</span>
            <div className="flex flex-wrap gap-1.5">
              {(['WebApp.gs', 'Index.html', 'Estilos.html', 'Logica.html', 'Code.gs'] as const).map(fileName => (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    selectedFile === fileName
                      ? 'bg-[#0A2540] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Code preview & copy button */}
          <div className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold flex items-center justify-between gap-2 ${
            selectedFile.endsWith('.gs')
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <span>
              {selectedFile.endsWith('.gs')
                ? `Archivo de script (.gs): En Apps Script créalo con "+ > Secuencia de comandos" y nómbralo "${selectedFile.replace('.gs', '')}". No pegues HTML aquí.`
                : `Archivo HTML (.html): En Apps Script créalo con "+ > HTML" (NO en .gs) y nómbralo "${selectedFile.replace('.html', '')}".`}
            </span>
          </div>

          <div className="relative rounded-xl bg-slate-900 p-4 text-slate-200 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                <Code2 className="w-4 h-4" /> {selectedFile}
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FF6B00] hover:bg-[#E05E00] text-white font-sans text-xs font-bold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : `Copiar ${selectedFile}`}</span>
              </button>
            </div>
            <pre className="overflow-x-auto max-h-56 text-[11px] leading-relaxed text-slate-300">
              {filesContent[selectedFile]}
            </pre>
          </div>

          {/* Input for WebApp URL */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-xs text-slate-800">
                URL de la Aplicación Web (Apps Script WebApp URL):
              </label>
              {getCleanUrl() && (
                <a
                  href={getCleanUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir WebApp en pestaña nueva
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-blue-900 outline-hidden font-mono"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[#0A2540] hover:bg-[#163B61] text-xs font-bold text-white transition cursor-pointer"
              >
                {savedSuccess ? '¡Guardada!' : 'Vincular'}
              </button>
            </div>

            {/* Guía rápida de configuración de despliegue en Google Apps Script */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-[11px] text-blue-900 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                Configuración del Despliegue en script.google.com:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                <li>
                  <strong>Terminación de la URL:</strong> Debe terminar en <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">/exec</code> (la app auto-completa la &apos;c&apos; si se pega con <code className="bg-blue-100 px-1 rounded text-blue-800 font-mono">/exe</code>).
                </li>
                <li>
                  <strong>Permiso de Acceso (Importante para evitar Error 403 Forbidden):</strong> En Apps Script, al pulsar <em>Implementar &gt; Gestionar implementaciones &gt; Editar</em> (icono de lápiz), asegúrate de que:
                  <ul className="list-disc pl-4 mt-0.5">
                    <li><strong>Ejecutar como:</strong> Yo (torduelespueblo@gmail.com)</li>
                    <li><strong>Quién tiene acceso:</strong> <em>Cualquier persona</em> (Anyone)</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
