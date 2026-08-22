import type { Installer, Resolver } from '../cli/install.ts';
import { assertArch, assertOS, unsupportedTarget, type Arch, type OS } from './utils/check.ts';
import { writeBinary } from './utils/fs.ts';
import { unzipAsync } from './utils/unzip.ts';

export const getLink = (releaseTag: string, arch: Arch, os: OS): string => {
  arch === 'x64' ||
    arch === 'arm64' ||
    unsupportedTarget(
      arch,
      os,
      'llrt supports linux_x64, linux_arm64, darwin_x64, darwin_arm64, win32_x64, win32_arm64',
    );
  if (os === 'win32') os = 'windows' as any;
  return `https://github.com/awslabs/llrt/releases/download/${releaseTag}/llrt-${os}-${arch}.zip`;
};

export const resolve: Resolver = async (id, config) => {
  let parts = id.split('_', 3),
    version: string =
      parts[0] === 'latest'
        ? (await fetch('https://github.com/awslabs/llrt/releases/latest')).url.slice(45)
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
  const files = await unzipAsync(bytes);

  if (resolved.os === 'win32') {
    await writeBinary(logGroup, 'llrt.exe', dest + '\\llrt.exe', files['llrt.exe']);
    return {
      bin: { 'llrt.exe': 'llrt.exe' },
    };
  }

  await writeBinary(logGroup, 'llrt', dest + '/llrt', files.llrt);
  return {
    bin: { llrt: 'llrt' },
  };
};
