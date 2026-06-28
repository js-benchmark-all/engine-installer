import { createDir, formatBytes, saveBinary, unsupportedTarget, type Arch, type Installer, type OS } from './utils.ts';
import { unzipSync, type Unzipped } from 'fflate/node';

const additionalMsg = 'quickjs supports linux-x64, linux-x86, win-x64, win-x86';

export const getLink = (releaseDate: string, arch: Arch, os: OS): string => {
  os === 'linux' || os === 'win' || unsupportedTarget(arch, os, additionalMsg);

  if (arch === 'x64') arch = 'x86_64' as any;
  else if (arch === 'x86') arch = 'i686' as any;
  else unsupportedTarget(arch, os, additionalMsg);

  return `https://bellard.org/quickjs/binary_releases/quickjs-${os}-${arch}-${releaseDate}.zip`;
}

export const getBinary = async (zipLink: string): Promise<Unzipped[string]> =>
  unzipSync(
    await (await fetch(zipLink)).bytes()
  ).qjs;

export const install: Installer = async (id, dest, version, arch, os) => {
  const logGroup = '[quickjs@' + id + ']';

  dest = await createDir(logGroup, dest, 'quickjs');

  const link = getLink(version, arch, os);
  console.info(logGroup, 'fetching', link);
  const binary = await getBinary(link);
  console.log(logGroup, 'binary size:', formatBytes(binary.byteLength));

  const qjs = await saveBinary(logGroup, os, dest, id, binary);
  console.info(logGroup, 'done :>');
  return { qjs };
}
