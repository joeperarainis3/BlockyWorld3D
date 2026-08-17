import { getAccessToken } from './firebaseAuth';
import { SandboxBlock } from '../types';

export interface DriveCourseMetadata {
  id: string;
  name: string;
  description?: string;
  modifiedTime: string;
  size?: string;
  blockCount?: number;
  author?: string;
}

export interface DriveSaveMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  coins?: number;
  gems?: number;
  stage?: number;
  petsCount?: number;
  playtime?: string;
}

export interface DriveCourseData {
  app: 'blocky_world_3d';
  type: 'course';
  version: number;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  blockCount: number;
  blocks: SandboxBlock[];
}

export interface DriveSaveData {
  app: 'blocky_world_3d';
  type: 'save';
  version: number;
  timestamp: string;
  coins: number;
  gems: number;
  stage: number;
  totalCheckpoints: number;
  pets: any[];
  avatar: any;
  tycoonProgress: any;
  purchasedEmotes?: string[];
}

export class GoogleDriveService {
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error('Google Drive authorization required. Please sign in with Google.');
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  // Get user profile & Drive storage info
  public static async getAboutInfo(): Promise<{ user?: any; storageQuota?: any }> {
    const headers = await this.getAuthHeaders();
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers,
    });
    if (!res.ok) {
      throw new Error(`Drive About API failed: ${res.statusText}`);
    }
    return await res.json();
  }

  // List courses stored in Google Drive
  public static async listCourses(): Promise<DriveCourseMetadata[]> {
    const headers = await this.getAuthHeaders();
    // Query for files with app=blocky_world_3d and type=course or matching name
    const q = "trashed = false and (appProperties has { key='app' and value='blocky_world_3d' } or name contains 'blocky_course_' or name contains '.blocky.json')";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,description,modifiedTime,size,appProperties)&orderBy=modifiedTime desc&pageSize=50`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list courses: ${res.statusText}`);
    }

    const data = await res.json();
    const files = data.files || [];

    return files.map((f: any) => ({
      id: f.id,
      name: f.appProperties?.title || f.name.replace(/^blocky_course_/, '').replace(/\.blocky\.json$/, '').replace(/_/g, ' '),
      description: f.description || f.appProperties?.description || 'Custom 3D Obby Course',
      modifiedTime: f.modifiedTime,
      size: f.size,
      blockCount: f.appProperties?.blockCount ? parseInt(f.appProperties.blockCount, 10) : undefined,
      author: f.appProperties?.author,
    }));
  }

  // Save / Upload Course to Google Drive
  public static async saveCourse(
    title: string,
    description: string,
    blocks: SandboxBlock[],
    existingFileId?: string,
    authorName?: string
  ): Promise<{ fileId: string; name: string }> {
    const headers = await this.getAuthHeaders();
    const fileName = `blocky_course_${title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}.blocky.json`;

    const coursePayload: DriveCourseData = {
      app: 'blocky_world_3d',
      type: 'course',
      version: 1,
      title: title.trim() || 'Untitled Course',
      description: description.trim() || 'Custom Blocky World course created in Studio',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blockCount: blocks.length,
      blocks,
    };

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: coursePayload.description,
      appProperties: {
        app: 'blocky_world_3d',
        type: 'course',
        title: coursePayload.title,
        description: coursePayload.description,
        blockCount: String(blocks.length),
        author: authorName || 'Player',
      },
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(coursePayload, null, 2) +
      closeDelimiter;

    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFileId) {
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const res = await fetch(uploadUrl, {
      method,
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to save course to Drive: ${res.statusText} (${errBody})`);
    }

    const result = await res.json();
    return { fileId: result.id, name: fileName };
  }

  // Load Course from Google Drive
  public static async loadCourse(fileId: string): Promise<DriveCourseData> {
    const headers = await this.getAuthHeaders();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to load course from Google Drive: ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.blocks || !Array.isArray(data.blocks)) {
      throw new Error('Invalid course format: Missing blocks data.');
    }

    return data as DriveCourseData;
  }

  // List Game Save Backups in Google Drive
  public static async listSaves(): Promise<DriveSaveMetadata[]> {
    const headers = await this.getAuthHeaders();
    const q = "trashed = false and (appProperties has { key='app' and value='blocky_world_3d' } or name contains 'blocky_save_')";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,description,modifiedTime,size,appProperties)&orderBy=modifiedTime desc&pageSize=30`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list saves: ${res.statusText}`);
    }

    const data = await res.json();
    const files = data.files || [];

    return files
      .filter((f: any) => f.appProperties?.type === 'save' || f.name.includes('blocky_save_'))
      .map((f: any) => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
        coins: f.appProperties?.coins ? parseInt(f.appProperties.coins, 10) : undefined,
        gems: f.appProperties?.gems ? parseInt(f.appProperties.gems, 10) : undefined,
        stage: f.appProperties?.stage ? parseInt(f.appProperties.stage, 10) : undefined,
        petsCount: f.appProperties?.petsCount ? parseInt(f.appProperties.petsCount, 10) : undefined,
      }));
  }

  // Save Game Progress to Google Drive
  public static async saveGameProgress(saveData: Omit<DriveSaveData, 'app' | 'type' | 'version' | 'timestamp'>): Promise<{ fileId: string }> {
    const headers = await this.getAuthHeaders();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const fileName = `blocky_save_${dateStr}_${timeStr}.json`;

    const payload: DriveSaveData = {
      app: 'blocky_world_3d',
      type: 'save',
      version: 1,
      timestamp: now.toISOString(),
      ...saveData,
    };

    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: `Blocky World 3D Cloud Save - Stage ${saveData.stage}, ${saveData.coins} Coins, ${saveData.gems} Gems`,
      appProperties: {
        app: 'blocky_world_3d',
        type: 'save',
        coins: String(saveData.coins),
        gems: String(saveData.gems),
        stage: String(saveData.stage),
        petsCount: String(saveData.pets?.length || 0),
        savedAt: now.toISOString(),
      },
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(payload, null, 2) +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      throw new Error(`Failed to backup save to Google Drive: ${res.statusText}`);
    }

    const result = await res.json();
    return { fileId: result.id };
  }

  // Load Game Save from Google Drive
  public static async loadGameProgress(fileId: string): Promise<DriveSaveData> {
    const headers = await this.getAuthHeaders();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download save from Google Drive: ${res.statusText}`);
    }

    const data = await res.json();
    return data as DriveSaveData;
  }

  // Delete a file from Google Drive (Requires explicit confirmation before invocation)
  public static async deleteFile(fileId: string): Promise<void> {
    const headers = await this.getAuthHeaders();
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers,
    });

    if (!res.ok && res.status !== 204 && res.status !== 404) {
      throw new Error(`Failed to delete file from Google Drive: ${res.statusText}`);
    }
  }

  // Create a Directory/Folder in Google Drive
  public static async createFolder(folderName: string, parentFolderId?: string): Promise<{ id: string; name: string }> {
    const headers = await this.getAuthHeaders();
    const metadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      appProperties: {
        app: 'blocky_world_3d',
        type: 'code_folder',
      },
    };

    if (parentFolderId) {
      metadata.parents = [parentFolderId];
    }

    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to create Google Drive folder: ${res.statusText} (${errText})`);
    }

    const data = await res.json();
    return { id: data.id, name: folderName };
  }

  // Upload an individual code file into a specific Drive folder
  public static async uploadFileToFolder(
    fileName: string,
    content: string,
    mimeType: string = 'text/plain',
    folderId?: string
  ): Promise<{ id: string; name: string }> {
    const headers = await this.getAuthHeaders();
    const metadata: any = {
      name: fileName,
      mimeType,
      appProperties: {
        app: 'blocky_world_3d',
        type: 'source_code',
      },
    };

    if (folderId) {
      metadata.parents = [folderId];
    }

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
      content +
      closeDelimiter;

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to upload ${fileName} to Google Drive: ${res.statusText} (${errText})`);
    }

    const data = await res.json();
    return { id: data.id, name: fileName };
  }

  // Upload all project source code files into a dedicated structured folder in Google Drive
  public static async uploadAllCodeFiles(
    files: { path: string; fileName: string; folder: string; content: string; mimeType: string }[],
    onProgress?: (current: number, total: number, fileName: string) => void
  ): Promise<{ rootFolderId: string; rootFolderName: string; uploadedCount: number }> {
    const dateStr = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
    const rootFolderName = `BlockyWorld3D_SourceCode_${dateStr}_${timeStr}`;

    // 1. Create Root Folder
    const rootFolder = await this.createFolder(rootFolderName);
    const folderCache: Record<string, string> = {
      '': rootFolder.id,
    };

    // Helper to get or create nested subfolder
    const getOrCreateFolder = async (folderPath: string): Promise<string> => {
      if (folderCache[folderPath]) return folderCache[folderPath];

      const parts = folderPath.split('/');
      let currentParentId = rootFolder.id;
      let accumulatedPath = '';

      for (const part of parts) {
        accumulatedPath = accumulatedPath ? `${accumulatedPath}/${part}` : part;
        if (folderCache[accumulatedPath]) {
          currentParentId = folderCache[accumulatedPath];
        } else {
          const newFolder = await this.createFolder(part, currentParentId);
          folderCache[accumulatedPath] = newFolder.id;
          currentParentId = newFolder.id;
        }
      }

      return currentParentId;
    };

    // 2. Upload files in sequence to prevent rate limits and report live progress
    let count = 0;
    for (const file of files) {
      if (onProgress) {
        onProgress(count + 1, files.length, file.path);
      }

      const targetFolderId = await getOrCreateFolder(file.folder);
      await this.uploadFileToFolder(file.fileName, file.content, file.mimeType, targetFolderId);
      count++;
    }

    // 3. Also upload a single full JSON bundle for easy 1-click download/import
    const bundleContent = JSON.stringify(
      {
        project: 'Blocky World 3D',
        exportedAt: new Date().toISOString(),
        totalFiles: files.length,
        files: files.map((f) => ({
          path: f.path,
          fileName: f.fileName,
          folder: f.folder,
          content: f.content,
        })),
      },
      null,
      2
    );

    await this.uploadFileToFolder(
      'BlockyWorld3D_Project_Bundle.json',
      bundleContent,
      'application/json',
      rootFolder.id
    );

    return {
      rootFolderId: rootFolder.id,
      rootFolderName,
      uploadedCount: count,
    };
  }

  // List code backup folders in Google Drive
  public static async listCodeBackups(): Promise<{ id: string; name: string; modifiedTime: string; webViewLink?: string }[]> {
    const headers = await this.getAuthHeaders();
    const q = "trashed = false and mimeType = 'application/vnd.google-apps.folder' and (name contains 'BlockyWorld3D_SourceCode' or appProperties has { key='app' and value='blocky_world_3d' })";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,modifiedTime,webViewLink)&orderBy=modifiedTime desc&pageSize=20`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      throw new Error(`Failed to list code backups: ${res.statusText}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  // List all files and subfolders inside a specific Google Drive folder
  public static async listFilesInFolder(
    folderId: string
  ): Promise<{ id: string; name: string; mimeType: string; size?: string; modifiedTime: string; webViewLink?: string; isFolder: boolean }[]> {
    const headers = await this.getAuthHeaders();
    const q = `trashed = false and '${folderId}' in parents`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&orderBy=folder,name asc&pageSize=100`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list files in folder: ${res.statusText} (${errText})`);
    }

    const data = await res.json();
    const files = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
    }));

    return files;
  }

  // Get the raw text / json content of a file from Google Drive
  public static async getFileContent(fileId: string): Promise<string> {
    const headers = await this.getAuthHeaders();
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to read file content: ${res.statusText} (${errText})`);
    }

    return await res.text();
  }
}

