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

const additionalMsg = 'quickjs supports linux_x64, linux_x86, win32_x64, win32_x86';

export const getLink = (releaseDate: string, arch: Arch, os: OS): string => {
  if (os === 'win32') os = 'win' as any;
  else if (os !== 'linux') unsupportedTarget(arch, os, additionalMsg);

  if (arch === 'x64') arch = 'x86_64' as any;
  else if (arch === 'x86') arch = 'i686' as any;
  else unsupportedTarget(arch, os, additionalMsg);

  return `https://bellard.org/quickjs/binary_releases/quickjs-${os}-${arch}-${releaseDate}.zip`;
};

export const resolve: Resolver = async (id: string) => {
  let parts = id.split('_', 3),
    version: string =
      parts[0] === 'latest'
        ? (await (await fetch('https://bellard.org/quickjs/binary_releases/LATEST.json')).json())
            .version
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

export const install: Installer = async (logGroup, resolved, dest) => {
  dest = await createDir(logGroup, dest, 'quickjs/' + resolved.id);

  const link = getLink(resolved.version, resolved.arch, resolved.os);
  console.info(logGroup, 'fetching', link);

  const bytes = await (await fetch(link)).bytes();
  console.info(logGroup, 'unzipping to', relative('.', dest));
  const files = unzipSync(bytes);

  if (resolved.os === 'win32') {
    await Promise.all([
      writeTo(logGroup, dest + '\\qjs.exe', files, 'qjs.exe'),
      writeTo(logGroup, dest + '\\libwinpthread-1.dll', files, 'libwinpthread-1.dll'),
    ]);

    return {
      bin: { 'qjs.exe': 'qjs.exe' },
    };
  }

  await Promise.all([
    writeTo(logGroup, dest + '/qjs', files, 'qjs'),
    writeTo(logGroup, dest + '/run-test262', files, 'run-test262'),
  ]);

  return {
    bin: { quickjs: 'qjs', 'quickjs-run-test262': 'run_test262' },
  };
};
