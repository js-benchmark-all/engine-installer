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

const additionalMsg =
  'llrt supports linux-x64, linux-arm64, mac-x64, mac-arm64, win-x64, win-arm64';

export const getLink = (releaseTag: string, arch: Arch, os: OS): string => {
  arch === 'x64' || arch === 'arm64' || unsupportedTarget(arch, os, additionalMsg);

  if (os === 'win32') os = 'windows' as any;

  return `https://github.com/awslabs/llrt/releases/download/${releaseTag}/llrt-${os}-${arch}.zip`;
};

export const getLatestLink = (arch: Arch, os: OS): string => {
  arch === 'x64' || arch === 'arm64' || unsupportedTarget(arch, os, additionalMsg);

  if (os === 'win32') os = 'windows' as any;

  return `https://github.com/awslabs/llrt/releases/latest/download/llrt-${os}-${arch}.zip`;
};

export const getBinary = async (zipLink: string): Promise<Unzipped[string]> =>
  Object.values(unzipSync(await (await fetch(zipLink)).bytes()))[0];

// parse version_arch_os
export const install: Installer = async (logGroup, id, dest) => {
  console.info(logGroup, 'installing', id);

  dest = await createDir(logGroup, dest, 'llrt');

  const parts = id.split('_', 3),
    version = parts[0],
    arch = assertArch(parts.length < 2 ? process.arch : parts[1]),
    os = assertOS(parts.length < 3 ? process.platform : parts[2]);

  const link = version === 'latest' ? getLatestLink(arch, os) : getLink(version, arch, os);
  console.info(logGroup, 'fetching', link);
  const binary = await getBinary(link);
  console.log(logGroup, 'binary size:', formatBytes(binary.byteLength));

  return { bin: { llrt: await saveBinary(logGroup, os, dest, id, binary) } };
};
