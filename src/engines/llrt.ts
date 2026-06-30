import { existsSync } from 'node:fs';
import type { Installer, Resolver } from '../cli/install.ts';
import {
  assertArch,
  assertOS,
  binaryPath,
  createDir,
  saveBinary,
  unsupportedTarget,
  type Arch,
  type OS,
} from './utils.ts';
import { unzipSync } from 'fflate/node';

export const getLink = (releaseTag: string, arch: Arch, os: OS): string => {
  arch === 'x64' ||
    arch === 'arm64' ||
    unsupportedTarget(
      arch,
      os,
      'llrt supports linux-x64, linux-arm64, mac-x64, mac-arm64, win-x64, win-arm64',
    );
  if (os === 'win32') os = 'windows' as any;
  return `https://github.com/awslabs/llrt/releases/download/${releaseTag}/llrt-${os}-${arch}.zip`;
};

export const resolve: Resolver = async (id: string) => {
  let parts = id.split('_', 3),
    version: string =
      parts[0] === 'latest'
        ? // slice https://github.com/awslabs/llrt/releases/tag/
          (await fetch('https://github.com/awslabs/llrt/releases/latest')).url.slice(45)
        : parts[0],
    os = assertOS(parts.length < 2 ? process.platform : parts[1]),
    arch = assertArch(parts.length < 3 ? process.arch : parts[2]);

  return {
    id: `${version}_${os}_${arch}`,
    version,
    os,
    arch,
  };
};

// parse version_arch_os
export const install: Installer = async (logGroup, resolved, dest, old) => {
  dest = binaryPath(resolved.os, await createDir(logGroup, dest, 'llrt'), resolved.id);

  if (old && existsSync(dest)) {
    console.info(logGroup, 'already installed');
    return old;
  }

  const link = getLink(resolved.version, resolved.arch, resolved.os);
  console.info(logGroup, 'fetching', link);
  await saveBinary(
    logGroup,
    resolved.id,
    dest,
    Object.values(unzipSync(await (await fetch(link)).bytes()))[0],
  );

  return {
    bin: {
      llrt: dest,
    },
  };
};
