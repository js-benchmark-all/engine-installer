import type { Installer, Resolver } from '../cli/install.ts';
import {
  assertArch,
  assertOS,
  unsupportedTarget,
  type Arch,
  type OS,
} from './utils/check.ts';
import { parseTarGzip } from 'nanotar';
import { writeBinary } from './utils/fs.ts';

export const getLink = (releaseTag: string, arch: Arch, os: OS): string => {
  ((arch === 'x64' || arch === 'arm64') &&
    (os === 'linux' || os === 'linux-musl' || os === 'darwin')) ||
    unsupportedTarget(
      arch,
      os,
      'porffor supports linux_x64, linux_arm64, linux-musl_x64, linux-musl_arm64, darwin_x64, darwin_arm64',
    );

  return (
    `https://github.com/CanadaHonk/porffor/releases/download/${releaseTag}/porffor-` +
    (os === 'linux-musl' ? `linux-${arch}-musl` : `${os}-${arch}`) +
    '.tar.gz'
  );
};

export const resolve: Resolver = async (id, config) => {
  let parts = id.split('_', 3),
    version: string =
      parts[0] === 'latest'
        ? (await fetch('https://github.com/CanadaHonk/porffor/releases/latest')).url.slice(45)
        : parts[0],
    os = parts.length < 2 ? config.os : assertOS(parts[1]),
    arch = parts.length < 3 ? config.arch : assertArch(parts[2]);

  return {
    id: `${version}_${os}_${arch}`,
    version,
    os,
    arch,
  };
};

// parse version_arch_os
export const install: Installer = async (logGroup, resolved, dest) => {
  const link = getLink(resolved.version, resolved.arch, resolved.os);

  console.info(logGroup, 'fetching', link);
  const bytes = await (await fetch(link)).bytes();

  console.info(logGroup, 'decompressing');
  const files = await parseTarGzip(bytes);

  await writeBinary(logGroup, 'porf', dest + '/porf', files[0].data!);
  return {
    bin: { porf: 'porf' },
  };
};
