import { existsSync } from 'node:fs';
import { relative } from 'node:path';

import type { Installer, Resolver } from '../cli/install.ts';
import {
  assertArch,
  assertOS,
  createDir,
  unsupportedTarget,
  writeTo,
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
      'llrt supports linux_x64, linux_arm64, mac_x64, mac_arm64, win32_x64, win32_arm64',
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
export const install: Installer = async (logGroup, resolved, dest) => {
  dest = await createDir(logGroup, dest, 'llrt/' + resolved.id);

  const link = getLink(resolved.version, resolved.arch, resolved.os);
  console.info(logGroup, 'fetching', link);

  const bytes = await (await fetch(link)).bytes();
  console.info(logGroup, 'unzipping to', relative('.', dest));
  const files = unzipSync(bytes);

  if (resolved.os === 'win32') {
    await writeTo(logGroup, dest + '\\llrt.exe', files, 'llrt.exe');
    return {
      bin: { 'llrt.exe': 'llrt.exe' },
    };
  }

  await writeTo(logGroup, dest + '/llrt', files, 'llrt');
  return {
    bin: { llrt: 'llrt' },
  };
};
