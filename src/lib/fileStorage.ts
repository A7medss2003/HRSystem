import localforage from 'localforage';

// Configure localforage instance for files
const fileStore = localforage.createInstance({
  name: 'hr-system-files',
  storeName: 'files'
});

export const saveFileToLocal = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      try {
        await fileStore.setItem(fileId, base64);
        resolve(fileId);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const saveDataUrlToLocal = async (dataUrl: string): Promise<string> => {
  const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  try {
    await fileStore.setItem(fileId, dataUrl);
    return fileId;
  } catch (err) {
    console.warn('Warning saving data URL:', err);
    throw err;
  }
};

export const getFileFromLocal = async (fileId: string): Promise<string | null> => {
  try {
    const data = await fileStore.getItem<string>(fileId);
    return data;
  } catch (err) {
    console.warn('Warning fetching file:', err);
    return null;
  }
};

export const deleteFileFromLocal = async (fileId: string): Promise<void> => {
  try {
    await fileStore.removeItem(fileId);
  } catch (err) {
    console.warn('Warning deleting file:', err);
  }
};