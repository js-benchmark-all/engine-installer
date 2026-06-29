import type { Installer } from '../cli/install.ts';
import {
  assertArch,
  assertOS,
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

export const getLatestVersion = async (): Promise<string> =>
  (await (await fetch('https://bellard.org/quickjs/binary_releases/LATEST.json')).json()).version;

// parse version_arch_os
export const install: Installer = async (logGroup, id, dest) => {
  dest = await createDir(logGroup, dest, 'quickjs');

  const parts = id.split('_', 3),
    version =
      id === 'latest'
        ? (console.info(logGroup, 'getting latest version info'), await getLatestVersion())
        : parts[0],
    arch = assertArch(parts.length < 2 ? process.arch : parts[1]),
    os = assertOS(parts.length < 3 ? process.platform : parts[2]);

  const link = getLink(version, arch, os);
  console.info(logGroup, 'fetching', link);
  const binary = await getBinary(link);
  console.log(logGroup, 'binary size:', formatBytes(binary.byteLength));

  return { bin: { qjs: await saveBinary(logGroup, os, dest, id, binary) } };
};
