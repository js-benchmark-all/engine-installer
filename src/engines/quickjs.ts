import { existsSync } from 'fs';
import type { Installer, Resolver } from '../cli/install.ts';
import {
  assertArch,
  assertOS,
  binaryPath,
  createDir,
  formatBytes,
  saveBinary,
  unsupportedTarget,
  type Arch,
  type OS,
} from './utils.ts';
import { unzipSync, type Unzipped } from 'fflate/node';

const additionalMsg = 'quickjs supports linux-x64, linux-x86, win-x64, win-x86';

export const getLink = (releaseDate: string, arch: Arch, os: OS): string => {
  if (os === 'win32') os = 'win' as any;
  else if (os !== 'linux') unsupportedTarget(arch, os, additionalMsg);

  if (arch === 'x64') arch = 'x86_64' as any;
  else if (arch === 'x86') arch = 'i686' as any;
  else unsupportedTarget(arch, os, additionalMsg);

  return `https://bellard.org/quickjs/binary_releases/quickjs-${os}-${arch}-${releaseDate}.zip`;
};
export const getBinary = async (zipLink: string): Promise<Unzipped[string]> =>
  unzipSync(await (await fetch(zipLink)).bytes()).qjs;

export const resolve: Resolver = async (id: string) => {
  let parts = id.split('_', 3),
    version: string = parts[0] === 'latest'
      ? (await (await fetch('https://bellard.org/quickjs/binary_releases/LATEST.json')).json()).version
      : parts[0],
    os = assertOS(parts.length < 2 ? process.platform : parts[1]),
    arch = assertArch(parts.length < 3 ? process.arch : parts[2]);

  return {
    id: `${version}_${os}_${arch}`,
    version,
    os,
    arch
  };
}

export const install: Installer = async (logGroup, resolved, dest, old) => {
  dest = binaryPath(resolved.os, await createDir(logGroup, dest, 'quickjs'), resolved.id);

  if (old && existsSync(dest)) {
    console.info(logGroup, 'already installed');
    return old;
  }

  const link = getLink(resolved.version, resolved.arch, resolved.os);
  console.info(logGroup, 'fetching', link);
  await saveBinary(logGroup, resolved.id, dest, await getBinary(link));

  return {
    bin: {
      quickjs: dest
    }
  };
};
