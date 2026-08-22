import { readlink, symlink, unlink, writeFile } from 'node:fs/promises';
import { dirname, relative } from 'node:path';
import { formatBytes } from './check.ts';

export const symlinkTo = async (logGroup: string, dest: string, bin: string): Promise<void> => {
  console.info(logGroup, 'linking', dest, 'to', bin);
  try {
    await readlink(dest);
    await unlink(dest);
  } catch (e) {
    if ((e as { code: string }).code !== 'ENOENT')
      return Promise.reject(new Error(`cannot override ${dest}, not a symlink.`));
  }
  return symlink(relative(dirname(dest), bin), dest);
};

const EXEC_MODE = {
  mode: 0o755,
};

export const writeBinary = (logGroup: string, name: string, path: string, content: Uint8Array): Promise<void> => {
  console.info(logGroup, 'writing binary', name, '(' + formatBytes(content.byteLength) + ')', 'to', path);
  return writeFile(path, content, EXEC_MODE);
}

export const write = (logGroup: string, name: string, path: string, content: Uint8Array): Promise<void> => {
  console.info(logGroup, 'writing', name, '(' + formatBytes(content.byteLength) + ')', 'to', path);
  return writeFile(path, content);
}
