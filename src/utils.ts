import { mkdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

export interface Config {
  /**
   * Default OS
   */
  os?: OS;

  /**
   * Default arch
   */
  arch?: Arch;

  /**
   * Installed engine binaries.
   */
  engines: Record<string, Record<string, string>>;
}

const ARCH = ['x64', 'x86', 'arm64', 'arm'] as const;
export type Arch = typeof ARCH[number];

const OS = ['linux', 'win', 'mac'] as const;
export type OS = typeof OS[number];

export type Installer = (id: string, dest: string, version: string, arch: Arch, os: OS) => Promise<Record<string, string>>;

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
}

export const createDir = async (logGroup: string, dest: string, id: string): Promise<string> => {
  dest = join(dest, id);
  console.info(logGroup, 'creating', relative('.', dest));
  await mkdir(dest, { recursive: true });
  return dest;
}

export const saveBinary = async (logGroup: string, os: OS, dest: string, id: string, binary: Parameters<typeof writeFile>[1]): Promise<string> => {
  dest = join(dest, os === 'win' ? id + '.exe' : id);
  console.info(logGroup, 'saving to', relative('.', dest));
  await writeFile(dest, binary);
  return dest;
}

export const useBinary = async (logGroup: string, os: OS, dest: string, id: string, binPath: string): Promise<string> => {
  if (os === 'win') {
    dest = join(dest, id + '.cmd');
    console.info(logGroup, 'saving script to', relative('.', dest));
    await writeFile(dest, `@echo off\n"${binPath}" %*`);
  } else {
    dest = join(dest, id);
    console.info(logGroup, 'saving script to', relative('.', dest));
    await writeFile(dest, `#!/usr/bin/env bash\n"${binPath}" "$@"`);
  }
  return dest;
}

export const assertOS = (v: string): OS => {
  if (OS.includes(v as any)) return v as any;
  throw new Error(`expected: ${OS.join(', ')}. recieved: ${v}.`);
}

export const assertArch = (v: string): Arch => {
  if (ARCH.includes(v as any)) return v as any;
  throw new Error(`expected: ${ARCH.join(', ')}. recieved: ${v}.`);
}

// parse engine@version_arch_os
