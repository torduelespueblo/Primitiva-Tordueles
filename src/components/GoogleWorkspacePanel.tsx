import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  getCurrentUser
} from '../services/googleAuth';
import {
  googleSheetsService,
  SpreadsheetInfo
} from '../services/googleSheetsService';
import {
  googleDriveService,
  DriveFileItem
} from '../services/googleDriveService';
import {
  Player,
  SyndicateSettings,
  TicketDraw,
  WaitingListEntry
} from '../types/lottery';
import {
  FileSpreadsheet,
  HardDrive,
  Upload,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Loader2,
  FileUp,
  Download
} from 'lucide-react';

interface GoogleWorkspacePanelProps {
  settings: SyndicateSettings;
  onUpdateSettings: (newSettings: SyndicateSettings) => void;
  players: Player[];
  onUpdatePlayers: (newPlayers: Player[]) => void;
  waitingList: WaitingListEntry[];
  tickets: TicketDraw[];
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({
  settings,
  onUpdateSettings,
  players,
  onUpdatePlayers,
  waitingList,
  tickets,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estados de Sheets
  const [connectedSpreadsheetId, setConnectedSpreadsheetId] = useState<string>(() => {
    if (settings.googleSheetUrl) {
      const match = settings.googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      return match ? match[1] : '';
    }
    return '';
  });
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);
  const [sheetSuccessMsg, setSheetSuccessMsg] = useState<string | null>(null);
  const [sheetErrorMsg, setSheetErrorMsg] = useState<string | null>(null);

  // Estados de Drive
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveFilter, setDriveFilter] = useState<'ALL' | 'SHEETS' | 'TICKETS' | 'PDF'>('ALL');
  const [driveSuccessMsg, setDriveSuccessMsg] = useState<string | null>(null);
  const [driveErrorMsg, setDriveErrorMsg] = useState<string | null>(null);
  const [officialFolder, setOfficialFolder] = useState<DriveFileItem | null>(null);

  // Modal de confirmación obligatoria para operaciones destructivas/mutantes (Google Workspace Rule)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmAction: () => Promise<void>;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    confirmAction: async () => {},
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Inicializar Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setIsLoadingAuth(false);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setIsLoadingAuth(false);
      }
    );

    // Intentar recuperar token en memoria
    getAccessToken().then(tok => {
      if (tok) setAccessToken(tok);
      setIsLoadingAuth(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Cargar datos de Drive y Sheets al obtener token
  useEffect(() => {
    if (accessToken) {
      loadDriveFiles(accessToken);
      if (connectedSpreadsheetId) {
        loadSpreadsheetDetails(accessToken, connectedSpreadsheetId);
      }
    }
  }, [accessToken, connectedSpreadsheetId]);

  const handleSignIn = async () => {
    setAuthError(null);
    setIsLoadingAuth(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setAuthError(msg);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setSpreadsheetInfo(null);
  };

  // Carga de metadatos de Google Sheets
  const loadSpreadsheetDetails = async (token: string, id: string) => {
    setIsLoadingSheet(true);
    setSheetErrorMsg(null);
    try {
      const info = await googleSheetsService.getSpreadsheet(token, id);
      setSpreadsheetInfo(info);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo obtener información de la hoja';
      setSheetErrorMsg(msg);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Carga de archivos de Google Drive
  const loadDriveFiles = async (token: string) => {
    setIsLoadingDrive(true);
    setDriveErrorMsg(null);
    try {
      // Buscar o crear carpeta oficial
      const folder = await googleDriveService.getOrCreateFolder(token);
      setOfficialFolder(folder);

      // Listar archivos relevantes
      const files = await googleDriveService.listFiles(token, {
        pageSize: 40,
      });
      setDriveFiles(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar archivos de Google Drive';
      setDriveErrorMsg(msg);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  // 1. CREAR HOJA OFICIAL EN GOOGLE SHEETS (MUTANTE: Requiere confirmación)
  const requestCreateOfficialSheet = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Crear Hoja Oficial en Google Sheets',
      message:
        'Se creará un nuevo archivo de hoja de cálculo en tu unidad de Google Drive titulado "Peña Primitiva Tordueles - Base de Datos Oficial" con las 4 pestañas de gestión (Configuración, Socios, Lista de Espera e Histórico de Jornadas) y se volcarán los datos actuales.',
      confirmText: 'Crear en Google Sheets',
      isDangerous: false,
      confirmAction: async () => {
        if (!accessToken) return;
        setIsLoadingSheet(true);
        setSheetErrorMsg(null);
        try {
          const newSheet = await googleSheetsService.createSyndicateSpreadsheet(
            accessToken,
            'Peña Primitiva Tordueles - Base de Datos Oficial',
            { settings, players, waitingList, tickets }
          );
          setConnectedSpreadsheetId(newSheet.id);
          setSpreadsheetInfo(newSheet);
          onUpdateSettings({ ...settings, googleSheetUrl: newSheet.url });
          setSheetSuccessMsg('¡Hoja oficial creada y sincronizada con éxito en tu Google Drive!');
          loadDriveFiles(accessToken);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al crear la hoja';
          setSheetErrorMsg(msg);
        } finally {
          setIsLoadingSheet(false);
        }
      },
    });
  };

  // 2. EXPORTAR / SOBRESCRIBIR DATOS EN GOOGLE SHEETS (DESTRUCTIVO: Requiere confirmación)
  const requestExportToSpreadsheet = () => {
    if (!connectedSpreadsheetId) {
      setSheetErrorMsg('Introduce un ID de hoja de Google Sheets válido antes de exportar.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Actualizar y Sobrescribir Datos en Google Sheets',
      message: `Esta acción actualizará el contenido de las pestañas 'Configuracion', 'Socios_Activos', 'Lista_Espera_Formulario' e 'Historico_Jornadas' en la hoja de cálculo (${connectedSpreadsheetId}) con los datos actuales de la aplicación. ¿Deseas continuar?`,
      confirmText: 'Sobrescribir Hoja',
      isDangerous: true,
      confirmAction: async () => {
        if (!accessToken) return;
        setIsLoadingSheet(true);
        setSheetErrorMsg(null);
        try {
          await googleSheetsService.exportAllData(accessToken, connectedSpreadsheetId, {
            settings,
            players,
            waitingList,
            tickets,
          });
          setSheetSuccessMsg('¡Datos de la peña volcados y actualizados con éxito en Google Sheets!');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al actualizar Google Sheets';
          setSheetErrorMsg(msg);
        } finally {
          setIsLoadingSheet(false);
        }
      },
    });
  };

  // 3. SINCRONIZAR DESDE GOOGLE SHEETS A LA APP
  const handleSyncFromSpreadsheet = async () => {
    if (!accessToken || !connectedSpreadsheetId) {
      setSheetErrorMsg('Conecta una hoja de cálculo antes de sincronizar.');
      return;
    }

    setIsLoadingSheet(true);
    setSheetErrorMsg(null);
    setSheetSuccessMsg(null);
    try {
      const data = await googleSheetsService.syncFromSpreadsheet(accessToken, connectedSpreadsheetId);
      if (data.settingsPartial) {
        onUpdateSettings({ ...settings, ...data.settingsPartial });
      }
      if (data.players && data.players.length > 0) {
        onUpdatePlayers(data.players);
      }
      setSheetSuccessMsg(
        `¡Sincronización completada! Se actualizaron los parámetros de la peña y ${data.players ? data.players.length : 0} socios desde Google Sheets.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar datos';
      setSheetErrorMsg(msg);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // 4. SUBIR ARCHIVO A GOOGLE DRIVE (MUTANTE: Requiere confirmación)
  const handleFileSelectedForDrive = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setConfirmModal({
      isOpen: true,
      title: 'Subir Resguardo o Documento a Google Drive',
      message: `¿Deseas subir "${file.name}" (${(file.size / 1024).toFixed(1)} KB) directamente a tu carpeta de Google Drive "${officialFolder?.name || 'Peña Primitiva Tordueles'}"?`,
      confirmText: 'Subir a Drive',
      isDangerous: false,
      confirmAction: async () => {
        if (!accessToken) return;
        setIsLoadingDrive(true);
        setDriveErrorMsg(null);
        try {
          await googleDriveService.uploadFile(
            accessToken,
            file,
            `Resguardo_Jornada_${settings.currentJornada}_${file.name}`,
            officialFolder?.id
          );
          setDriveSuccessMsg(`¡Archivo "${file.name}" subido a Google Drive correctamente!`);
          loadDriveFiles(accessToken);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al subir el archivo';
          setDriveErrorMsg(msg);
        } finally {
          setIsLoadingDrive(false);
          event.target.value = '';
        }
      },
    });
  };

  // 5. ELIMINAR ARCHIVO EN GOOGLE DRIVE (DESTRUCTIVO: Requiere confirmación)
  const requestDeleteDriveFile = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Archivo de Google Drive',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${file.name}" de Google Drive? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar Archivo',
      isDangerous: true,
      confirmAction: async () => {
        if (!accessToken) return;
        setIsLoadingDrive(true);
        setDriveErrorMsg(null);
        try {
          await googleDriveService.deleteFile(accessToken, file.id);
          setDriveSuccessMsg(`El archivo "${file.name}" ha sido eliminado.`);
          loadDriveFiles(accessToken);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al eliminar el archivo';
          setDriveErrorMsg(msg);
        } finally {
          setIsLoadingDrive(false);
        }
      },
    });
  };

  // Filtrado de archivos de Drive
  const filteredFiles = driveFiles.filter(file => {
    if (driveFilter === 'SHEETS') {
      return file.mimeType.includes('spreadsheet') || file.name.endsWith('.xlsx');
    }
    if (driveFilter === 'TICKETS') {
      return file.mimeType.startsWith('image/') || file.name.toLowerCase().includes('resguardo');
    }
    if (driveFilter === 'PDF') {
      return file.mimeType.includes('pdf') || file.name.endsWith('.pdf');
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Cabecera de la sección Google Workspace */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0A2540] flex items-center justify-center text-white shadow-md shrink-0">
              <HardDrive className="w-7 h-7 text-[#FF6B00]" />
            </div>
            <div>
              <span className="text-sm font-extrabold uppercase tracking-wider text-[#FF6B00] block">
                Google Drive &amp; Sheets
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#0A2540]">
                Google Workspace
              </h1>
              <p className="text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Almacena la base de datos de socios en <strong>Google Sheets</strong> y custodia los resguardos y boletos oficiales en <strong>Google Drive</strong>.
              </p>
            </div>
          </div>

          {/* Autenticación Google Oficial */}
          <div>
            {!currentUser ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoadingAuth}
                className="gsi-material-button relative inline-flex items-center justify-center p-0.5 overflow-hidden text-base font-semibold text-slate-900 rounded-xl group bg-white border border-slate-300 shadow-xs hover:bg-slate-50 hover:shadow-md transition cursor-pointer min-h-[48px]"
              >
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span className="font-bold text-[#0A2540]">
                    {isLoadingAuth ? 'Conectando...' : 'Iniciar Sesión con Google'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-[#F4F6F9] border border-slate-200 rounded-2xl p-3 shadow-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuario Google'}
                    className="w-11 h-11 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0A2540] text-white font-bold flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left pr-2">
                  <p className="text-sm sm:text-base font-bold text-[#0A2540] leading-tight">
                    {currentUser.displayName || 'Administrador Google'}
                  </p>
                  <p className="text-sm text-slate-600 truncate max-w-[200px]">
                    {currentUser.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 min-h-[44px] text-sm font-bold text-slate-700 hover:text-red-700 hover:bg-red-50 rounded-xl transition cursor-pointer"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {!currentUser ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#0A2540] text-[#FF6B00] mx-auto flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black font-serif text-[#0A2540]">
            Conecta tu cuenta de Google para activar Sheets y Drive
          </h2>
          <p className="text-base text-slate-600 max-w-xl mx-auto mt-2 leading-relaxed">
            Inicia sesión con tu cuenta de Google para vincular la hoja de socios y guardar automáticamente los resguardos fotográficos en Google Drive.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={handleSignIn}
              className="flex items-center gap-3 px-6 min-h-[52px] rounded-2xl bg-[#0A2540] hover:bg-[#13375B] text-white font-bold text-base shadow-md transition cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              <span>Acceder con Google</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECCIÓN 1: GOOGLE SHEETS */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0A2540]">Google Sheets</h2>
                    <p className="text-sm text-slate-600">Base de datos de socios y ciclos</p>
                  </div>
                </div>

                {connectedSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl text-sm font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    <span>Abrir</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {sheetSuccessMsg && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{sheetSuccessMsg}</span>
                </div>
              )}

              {sheetErrorMsg && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{sheetErrorMsg}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-[#0A2540] mb-1.5">
                    ID o URL de la Hoja de Google Sheets
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={connectedSpreadsheetId}
                      onChange={e => {
                        const val = e.target.value.trim();
                        const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                        setConnectedSpreadsheetId(match ? match[1] : val);
                      }}
                      placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="flex-1 px-3.5 min-h-[46px] rounded-xl text-base font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A2540] bg-slate-50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (accessToken && connectedSpreadsheetId) {
                          loadSpreadsheetDetails(accessToken, connectedSpreadsheetId);
                        }
                      }}
                      disabled={isLoadingSheet || !connectedSpreadsheetId}
                      className="px-4 min-h-[46px] rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-base font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isLoadingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      <span>Verificar</span>
                    </button>
                  </div>
                </div>

                {spreadsheetInfo && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-base">
                      <span className="font-bold text-emerald-950">{spreadsheetInfo.title}</span>
                      <span className="text-emerald-800 font-mono text-sm">
                        {spreadsheetInfo.sheets.length} pestañas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {spreadsheetInfo.sheets.map(sheet => (
                        <span
                          key={sheet.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-sm font-semibold text-emerald-900"
                        >
                          {sheet.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6 space-y-3">
              <button
                type="button"
                onClick={requestCreateOfficialSheet}
                disabled={isLoadingSheet}
                className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl text-base font-bold text-white bg-[#0A2540] hover:bg-[#13375B] shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-[#FF6B00]" />
                <span>Crear Hoja Oficial en Drive</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleSyncFromSpreadsheet}
                  disabled={isLoadingSheet || !connectedSpreadsheetId}
                  className="flex items-center justify-center gap-2 min-h-[46px] px-3 rounded-xl text-base font-bold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Sincronizar a App</span>
                </button>

                <button
                  type="button"
                  onClick={requestExportToSpreadsheet}
                  disabled={isLoadingSheet || !connectedSpreadsheetId}
                  className="flex items-center justify-center gap-2 min-h-[46px] px-3 rounded-xl text-base font-bold text-[#0A2540] bg-slate-100 hover:bg-slate-200 border border-slate-300 transition cursor-pointer disabled:opacity-50"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Exportar a Sheets</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: GOOGLE DRIVE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF6B00] flex items-center justify-center">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-[#0A2540]">Google Drive</h2>
                    <p className="text-sm text-slate-600">Custodia oficial de resguardos y PDFs</p>
                  </div>
                </div>

                {officialFolder && (
                  <a
                    href={officialFolder.webViewLink || 'https://drive.google.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-xl text-sm font-bold bg-slate-100 text-[#0A2540] hover:bg-slate-200 border border-slate-200 transition"
                  >
                    <FolderOpen className="w-4 h-4 text-[#FF6B00]" />
                    <span>Carpeta</span>
                  </a>
                )}
              </div>

              {driveSuccessMsg && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                  <span>{driveSuccessMsg}</span>
                </div>
              )}

              {driveErrorMsg && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{driveErrorMsg}</span>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                <span className="text-base font-bold text-[#0A2540]">Archivos en Drive</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['ALL', 'TICKETS', 'SHEETS', 'PDF'] as const).map(tab => (
                    <button
                      type="button"
                      key={tab}
                      onClick={() => setDriveFilter(tab)}
                      className={`px-3 min-h-[38px] rounded-lg text-sm font-bold transition cursor-pointer ${
                        driveFilter === tab
                          ? 'bg-[#0A2540] text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'ALL' ? 'Todos' : tab === 'TICKETS' ? 'Resguardos' : tab === 'SHEETS' ? 'Hojas' : 'PDFs'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50">
                {isLoadingDrive ? (
                  <div className="p-8 text-center text-base text-slate-600 flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#FF6B00]" />
                    <span>Consultando Google Drive...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="p-6 text-center text-base text-slate-600">
                    No se encontraron archivos en este filtro.
                  </div>
                ) : (
                  filteredFiles.map(file => {
                    const isSheet = file.mimeType.includes('spreadsheet');
                    const isImg = file.mimeType.startsWith('image/');
                    return (
                      <div
                        key={file.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-white transition text-base"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {isSheet ? (
                            <FileSpreadsheet className="w-5 h-5 shrink-0 text-emerald-600" />
                          ) : isImg ? (
                            <ImageIcon className="w-5 h-5 shrink-0 text-[#0A2540]" />
                          ) : (
                            <FileText className="w-5 h-5 shrink-0 text-[#FF6B00]" />
                          )}
                          <div className="truncate">
                            <p className="font-bold text-[#0A2540] truncate">{file.name}</p>
                            <p className="text-sm text-slate-500">
                              {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Drive'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-600 hover:text-[#0A2540] hover:bg-slate-100"
                              title="Abrir en Google Drive"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => requestDeleteDriveFile(file)}
                            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Eliminar archivo de Drive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <label className="w-full flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl text-base font-bold text-white bg-[#FF6B00] hover:bg-[#E55E00] shadow-xs transition cursor-pointer">
                <Upload className="w-5 h-5" />
                <span>Subir Resguardo a Google Drive</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelectedForDrive}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.isDangerous ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-[#FF6B00]'
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-[#0A2540]">{confirmModal.title}</h3>
            </div>

            <p className="text-base text-slate-700 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                disabled={isProcessingAction}
                className="px-4 min-h-[44px] rounded-xl text-base font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsProcessingAction(true);
                  try {
                    await confirmModal.confirmAction();
                  } finally {
                    setIsProcessingAction(false);
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                disabled={isProcessingAction}
                className={`px-5 min-h-[44px] rounded-xl text-base font-bold text-white transition flex items-center gap-2 cursor-pointer ${
                  confirmModal.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0A2540] hover:bg-[#13375B]'
                }`}
              >
                {isProcessingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
