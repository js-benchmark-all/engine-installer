import { type Unzipped, unzip } from 'fflate/node';

import { symlink, writeFile } from 'node:fs/promises';
import { relative } from 'node:path';

const ARCH = ['x64', 'x86', 'arm64', 'arm'] as const;
export type Arch = (typeof ARCH)[number];

const OS = ['linux', 'win32', 'darwin'] as const;
export type OS = (typeof OS)[number];

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

const cb = function (this: PromiseWithResolvers<any>, err: any, data: any) {
  err === null ? this.resolve(data) : this.reject(err);
};

export const unzipAsync = (data: Parameters<typeof unzip>[0]): Promise<Unzipped> => {
  const resolver = Promise.withResolvers<Unzipped>();
  unzip(data, cb.bind(resolver));
  return resolver.promise;
};

export const unsupportedTarget = (arch: Arch, os: OS, additionalMsg: string): never => {
  throw new Error(`installer does not support ${os}-${arch} (${additionalMsg})`);
};

export const writeUzippedTo = (
  logGroup: string,
  dest: string,
  zip: Unzipped,
  key: string,
): Promise<void> => {
  console.info(
    logGroup,
    'writing',
    key,
    '(' + formatBytes(zip[key].byteLength) + ')',
    'to',
    relative('.', dest),
  );
  return writeFile(dest, zip[key]);
};

export const symlinkTo = (logGroup: string, dest: string, installedDir: string): Promise<void> => {
  console.info(logGroup, 'symlink', relative('.', installedDir), 'to', relative('.', dest));
  return symlink(dest, installedDir);
};

export const assertOS = (v: string): OS => {
  if (OS.includes(v as any)) return v as any;
  throw new Error(`expected: ${OS.join(', ')}. recieved: ${v}.`);
};

export const assertArch = (v: string): Arch => {
  if (ARCH.includes(v as any)) return v as any;
  throw new Error(`expected: ${ARCH.join(', ')}. recieved: ${v}.`);
};
