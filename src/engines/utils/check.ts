const ARCH = ['x64', 'x86', 'arm64', 'arm'] as const;
export type Arch = (typeof ARCH)[number];

const OS = ['linux', 'linux-musl', 'win32', 'darwin'] as const;
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

export const unsupportedTarget = (arch: Arch, os: OS, additionalMsg: string): never => {
  throw new Error(`installer does not support ${os}-${arch} (${additionalMsg})`);
};

export const assertOS = (v: string): OS => {
  if (OS.includes(v as any)) return v as any;
  throw new Error(`expected: ${OS.join(', ')}. recieved: ${v}.`);
};

export const assertArch = (v: string): Arch => {
  if (ARCH.includes(v as any)) return v as any;
  throw new Error(`expected: ${ARCH.join(', ')}. recieved: ${v}.`);
};
