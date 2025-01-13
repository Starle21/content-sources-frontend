import CryptoJS from 'crypto-js';

// Change this number to change chunk/slice size
export const MAX_CHUNK_SIZE = 1048576 * 3; // MB

export const BATCH_SIZE = 5;

export const MAX_RETRY_COUNT = 3;

const readSlice = (file: File, start: number, size: number): Promise<Uint8Array> =>
  new Promise<Uint8Array>((resolve, reject) => {
    const fileReader = new FileReader();
    const slice = file.slice(start, start + size);

    fileReader.onload = () => resolve(new Uint8Array(fileReader.result as ArrayBuffer));
    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(slice);
  });

export const getFileChecksumSHA256 = async (file: File): Promise<string> => {
  let sha256 = CryptoJS.algo.SHA256.create();
  let start = 0;

  while (start < file.size) {
    const slice: Uint8Array = await readSlice(file, start, MAX_CHUNK_SIZE);
    const wordArray = CryptoJS.lib.WordArray.create(slice);
    sha256 = sha256.update(wordArray);
    start += MAX_CHUNK_SIZE;
  }

  sha256.finalize();

  return sha256._hash.toString();
};

export type Chunk = {
  slice: Blob;
  sha256: string;
  chunkRange: string;
  start: number;
  end: number;
  queued: boolean;
  completed: boolean;
  retryCount: number;
  cancel?: () => void;
};

export type FileInfo = {
  uuid: string;
  created: string;
  artifact: string;
  chunks: Chunk[];
  checksum: string;
  file: File;
  error?: string;
  completed?: boolean;
  failed?: boolean;
  isResumed?: boolean;
  isRetrying?: boolean;
};
