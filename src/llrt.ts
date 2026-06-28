import { mkdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { createDir, formatBytes, saveBinary, unsupportedTarget, type Arch, type Installer, type OS } from './utils.ts';
import { unzipSync, type Unzipped } from 'fflate/node';

const additionalMsg = 'llrt supports linux-x64, linux-arm64, mac-x64, mac-arm64, win-x64, win-arm64';

export const getLink = (releaseTag: string, arch: Arch, os: OS): string => {
  arch === 'x64' || arch === 'arm64' || unsupportedTarget(arch, os, additionalMsg);

  if (os === 'mac') os = 'darwin' as any;
  else if (os === 'win') os = 'windows' as any;

  return `https://github.com/awslabs/llrt/releases/download/${releaseTag}/llrt-${os}-${arch}.zip`;
}

export const getBinary = async (zipLink: string): Promise<Unzipped[string]> =>
  Object.values(unzipSync(
    await (await fetch(zipLink)).bytes()
  ))[0];

export const install: Installer = async (id, dest, version, arch, os) => {
  const logGroup = '[llrt@' + id + ']';

  dest = await createDir(logGroup, dest, 'llrt');

  const link = getLink(version, arch, os);
  console.info(logGroup, 'fetching', link);
  const binary = await getBinary(link);
  console.log(logGroup, 'binary size:', formatBytes(binary.byteLength));

  const llrt = await saveBinary(logGroup, os, dest, id, binary);
  console.info(logGroup, 'done :>');
  return { llrt };
}
