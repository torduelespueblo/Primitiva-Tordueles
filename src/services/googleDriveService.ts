/**
 * Servicio para interactuar con la API de Google Drive v3
 */

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
}

export const googleDriveService = {
  /**
   * Lista archivos de Google Drive filtrados opcionalmente por tipo o carpeta
   */
  async listFiles(
    accessToken: string,
    options?: {
      folderId?: string;
      mimeType?: string;
      query?: string;
      pageSize?: number;
    }
  ): Promise<DriveFileItem[]> {
    const qParts: string[] = ['trashed = false'];

    if (options?.folderId) {
      qParts.push(`'${options.folderId}' in parents`);
    }

    if (options?.mimeType) {
      qParts.push(`mimeType = '${options.mimeType}'`);
    }

    if (options?.query) {
      qParts.push(`name contains '${options.query.replace(/'/g, "\\'")}'`);
    }

    const q = encodeURIComponent(qParts.join(' and '));
    const fields = encodeURIComponent('files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, iconLink, size, createdTime, modifiedTime)');
    const pageSize = options?.pageSize || 30;

    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&pageSize=${pageSize}&orderBy=modifiedTime desc`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al listar archivos de Google Drive (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  },

  /**
   * Busca o crea la carpeta oficial de la peña en Google Drive
   */
  async getOrCreateFolder(accessToken: string, folderName: string = 'Peña Primitiva Tordueles - Resguardos'): Promise<DriveFileItem> {
    const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)`;

    const res = await fetch(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.files && data.files.length > 0) {
        return data.files[0];
      }
    }

    // Crear la carpeta si no existe
    const createUrl = 'https://www.googleapis.com/drive/v3/files';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error al crear la carpeta en Google Drive');
    }

    return await createRes.json();
  },

  /**
   * Sube un resguardo o archivo a Google Drive (multipart upload)
   */
  async uploadFile(
    accessToken: string,
    file: File | Blob,
    fileName: string,
    folderId?: string
  ): Promise<DriveFileItem> {
    const metadata: Record<string, unknown> = {
      name: fileName,
      mimeType: file.type || 'application/octet-stream',
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const fileReader = new FileReader();
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
      fileReader.onerror = () => reject(new Error('Error al leer el archivo para subir a Drive'));
      fileReader.readAsArrayBuffer(file);
    });

    const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
    const mediaPartHeader = `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`;

    const metaPartUint8 = new TextEncoder().encode(delimiter + metaPart + delimiter + mediaPartHeader);
    const closeDelimiterUint8 = new TextEncoder().encode(closeDelimiter);

    const fullBlob = new Blob([metaPartUint8, arrayBuffer, closeDelimiterUint8], {
      type: `multipart/related; boundary=${boundary}`,
    });

    const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink,webContentLink';

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: fullBlob,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Error al subir el archivo a Google Drive (${res.status})`);
    }

    return await res.json();
  },

  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(accessToken: string, fileId: string): Promise<boolean> {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error al eliminar el archivo de Google Drive');
    }

    return true;
  },
};
