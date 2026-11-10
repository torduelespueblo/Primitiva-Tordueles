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
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#0d253f] to-blue-700 flex items-center justify-center text-white shadow-md">
              <HardDrive className="w-7 h-7 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-serif text-[#0d253f]">
                  Google Workspace
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Google Drive & Sheets
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Almacena la base de datos de socios en <strong>Google Sheets</strong> y custodia los resguardos y boletos oficiales en <strong>Google Drive</strong> de forma 100% gratuita y segura.
              </p>
            </div>
          </div>

          {/* Autenticación Google Oficial (GSI button required by skill) */}
          <div>
            {!currentUser ? (
              <button
                onClick={handleSignIn}
                disabled={isLoadingAuth}
                className="gsi-material-button relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-slate-900 rounded-xl group bg-white border border-slate-300 shadow-xs hover:bg-slate-50 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span className="font-semibold text-slate-700">
                    {isLoadingAuth ? 'Conectando con Google...' : 'Iniciar Sesión con Google'}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 shadow-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Usuario Google'}
                    className="w-10 h-10 rounded-full border border-slate-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left pr-2">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.displayName || 'Administrador Google'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {!currentUser ? (
        /* Estado de Invitación a Conectar */
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 mx-auto flex items-center justify-center mb-4">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold font-serif text-[#0d253f]">
            Conecta tu cuenta de Google para activar Sheets y Drive
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mt-2">
            Inicia sesión con tu cuenta de Google con un clic para vincular tu hoja de cálculo de socios de la Peña y guardar automáticamente los resguardos fotográficos en Google Drive.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleSignIn}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-[#0d253f] hover:bg-[#153a61] text-white font-bold text-sm shadow-md transition"
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
        /* Paneles de Control cuando el usuario está autenticado */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECCIÓN 1: GOOGLE SHEETS */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Google Sheets
                    </h2>
                    <p className="text-xs text-slate-500">
                      Base de datos de socios, pagos y ciclos
                    </p>
                  </div>
                </div>

                {connectedSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${connectedSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    <span>Abrir en Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {sheetSuccessMsg && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{sheetSuccessMsg}</span>
                </div>
              )}

              {sheetErrorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{sheetErrorMsg}</span>
                </div>
              )}

              {/* ID de la hoja vinculada */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ID o URL de la Hoja de Google Sheets
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={connectedSpreadsheetId}
                      onChange={e => {
                        const val = e.target.value.trim();
                        const match = val.match(/\/d\/([a-zA-Z0-9-_]+)/);
                        setConnectedSpreadsheetId(match ? match[1] : val);
                      }}
                      placeholder="Ej: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    />
                    <button
                      onClick={() => {
                        if (accessToken && connectedSpreadsheetId) {
                          loadSpreadsheetDetails(accessToken, connectedSpreadsheetId);
                        }
                      }}
                      disabled={isLoadingSheet || !connectedSpreadsheetId}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      {isLoadingSheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Verificar</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de la hoja conectada */}
                {spreadsheetInfo && (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-950">
                        {spreadsheetInfo.title}
                      </span>
                      <span className="text-emerald-700 font-mono text-[11px]">
                        {spreadsheetInfo.sheets.length} pestañas
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {spreadsheetInfo.sheets.map(sheet => (
                        <span
                          key={sheet.id}
                          className="px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-[10px] font-semibold text-emerald-900"
                        >
                          {sheet.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Acciones de sincronización y exportación */}
            <div className="pt-6 border-t border-slate-100 mt-6 space-y-2.5">
              <button
                onClick={requestCreateOfficialSheet}
                disabled={isLoadingSheet}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0d253f] hover:bg-[#153a61] shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-sky-300" />
                <span>Crear Nueva Hoja Oficial en mi Google Drive</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSyncFromSpreadsheet}
                  disabled={isLoadingSheet || !connectedSpreadsheetId}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                  title="Importar valores actualizados de la hoja a la aplicación"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sincronizar a App</span>
                </button>

                <button
                  onClick={requestExportToSpreadsheet}
                  disabled={isLoadingSheet || !connectedSpreadsheetId}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer disabled:opacity-50"
                  title="Sobrescribir hoja con datos actuales de la app (con confirmación)"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Exportar a Sheets</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: GOOGLE DRIVE */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                    <HardDrive className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Google Drive
                    </h2>
                    <p className="text-xs text-slate-500">
                      Custodia oficial de resguardos sellados y PDFs
                    </p>
                  </div>
                </div>

                {officialFolder && (
                  <a
                    href={officialFolder.webViewLink || 'https://drive.google.com'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ver Carpeta</span>
                  </a>
                )}
              </div>

              {driveSuccessMsg && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{driveSuccessMsg}</span>
                </div>
              )}

              {driveErrorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{driveErrorMsg}</span>
                </div>
              )}

              {/* Filtros de archivos */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Archivos en Drive</span>
                <div className="flex items-center gap-1">
                  {(['ALL', 'TICKETS', 'SHEETS', 'PDF'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setDriveFilter(tab)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition ${
                        driveFilter === tab
                          ? 'bg-[#0d253f] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'ALL' ? 'Todos' : tab === 'TICKETS' ? 'Resguardos' : tab === 'SHEETS' ? 'Hojas' : 'PDFs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista de archivos en Google Drive */}
              <div className="mt-3 divide-y divide-slate-100 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50">
                {isLoadingDrive ? (
                  <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Consultando Google Drive...</span>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No se encontraron archivos en este filtro. Sube tu primer resguardo sellado.
                  </div>
                ) : (
                  filteredFiles.map(file => {
                    const isSheet = file.mimeType.includes('spreadsheet');
                    const isImg = file.mimeType.startsWith('image/');
                    return (
                      <div
                        key={file.id}
                        className="p-2.5 px-3 flex items-center justify-between gap-3 hover:bg-white transition text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isSheet ? (
                            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                          ) : isImg ? (
                            <ImageIcon className="w-4 h-4 shrink-0 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                          )}
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {file.createdTime ? new Date(file.createdTime).toLocaleDateString() : 'Drive'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                              title="Abrir en Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => requestDeleteDriveFile(file)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar archivo de Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Subir archivo a Google Drive */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              <label className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 shadow-xs transition cursor-pointer">
                <Upload className="w-4 h-4 text-sky-200" />
                <span>Subir Resguardo o Documento a Google Drive</span>
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

      {/* MODAL DE CONFIRMACIÓN OBLIGATORIA (User Confirmation for Destructive/Mutating Operations) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmModal.isDangerous ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
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
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition flex items-center gap-2 ${
                  confirmModal.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0d253f] hover:bg-[#153a61]'
                }`}
              >
                {isProcessingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
