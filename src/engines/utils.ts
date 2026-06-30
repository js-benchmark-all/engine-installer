import { mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ARCH = ['x64', 'x86', 'arm64', 'arm'] as const;
export type Arch = (typeof ARCH)[number];

const OS = ['linux', 'win32', 'darwin'] as const;
export type OS = (typeof OS)[number];

export const ENGINE = ['llrt', 'quickjs'] as const;

export const formatBytes = (size: number): string => {
  let unit = 'b';
  if (size >= 1e6) {
    size /= 1e6;
    unit = 'mb';
  } else if (size >= 1e3) {
    size /= 1e3;
    unit = 'kb';
  }
  return Math.round(size * 100) / 100 + unit;
};

export const unsupportedTarget = (arch: Arch, os: OS, additionalMsg: string): never => {
  throw new Error(`installer does not support ${os}-${arch} (${additionalMsg})`);
};

export const createDir = async (logGroup: string, dest: string, id: string): Promise<string> => {
  dest = join(dest, id);
  console.info(logGroup, 'creating', relative('.', dest));
  await mkdir(dest, { recursive: true });
  return dest;
};

export const binaryPath = (os: OS, dest: string, id: string): string =>
  join(dest, os === 'win32' ? id + '.exe' : id);

export const saveBinary = (
  logGroup: string,
  binName: string,
  dest: string,
  binary: Uint8Array<ArrayBuffer>,
): Promise<void> => {
  console.info(
    logGroup,
    'saving binary',
    binName,
    '(' + formatBytes(binary.byteLength) + ')',
    'to',
    relative('.', dest),
  );
  return writeFile(dest, binary);
};

export const useBinary = async (
  logGroup: string,
  os: OS,
  dest: string,
  id: string,
  binPath: string,
): Promise<string> => {
  if (os === 'win32') {
    dest = join(dest, id + '.cmd');
    console.info(logGroup, 'saving script to', relative('.', dest));
    await writeFile(dest, `@echo off\n"${binPath}" %*`);
  } else {
    dest = join(dest, id);
    console.info(logGroup, 'saving script to', relative('.', dest));
    await writeFile(dest, `#!/usr/bin/env bash\n"${binPath}" "$@"`);
  }
  return dest;
};

export const assertOS = (v: string): OS => {
  if (OS.includes(v as any)) return v as any;
  throw new Error(`expected: ${OS.join(', ')}. recieved: ${v}.`);
};

export const assertArch = (v: string): Arch => {
  if (ARCH.includes(v as any)) return v as any;
  throw new Error(`expected: ${ARCH.join(', ')}. recieved: ${v}.`);
};
