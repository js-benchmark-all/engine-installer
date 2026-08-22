import type { Installer, Resolver } from '../cli/install.ts';
import { assertArch, assertOS, unsupportedTarget, type Arch, type OS } from './utils/check.ts';
import { write, writeBinary } from './utils/fs.ts';
import { unzipAsync } from './utils/unzip.ts';

const additionalMsg = 'quickjs supports linux_x64, linux_x86, win32_x64, win32_x86';

export const getLink = (releaseDate: string, arch: Arch, os: OS): string => {
  if (os === 'win32') os = 'win' as any;
  else if (os !== 'linux') unsupportedTarget(arch, os, additionalMsg);

  if (arch === 'x64') arch = 'x86_64' as any;
  else if (arch === 'x86') arch = 'i686' as any;
  else unsupportedTarget(arch, os, additionalMsg);

  return `https://bellard.org/quickjs/binary_releases/quickjs-${os}-${arch}-${releaseDate}.zip`;
};

export const resolve: Resolver = async (id, config) => {
  let parts = id.split('_', 3),
    version: string =
      parts[0] === 'latest'
        ? (await (await fetch('https://bellard.org/quickjs/binary_releases/LATEST.json')).json())
            .version
        : parts[0],
    os = parts.length < 2 ? config.os : assertOS(parts[1]),
    arch = parts.length < 3 ? (process.arch as any) : assertArch(parts[2]);

  return {
    id: `${version}_${os}_${arch}`,
    version,
    os,
    arch,
  };
};

export const install: Installer = async (logGroup, resolved, dest) => {
  const link = getLink(resolved.version, resolved.arch, resolved.os);

  console.info(logGroup, 'fetching', link);
  const bytes = await (await fetch(link)).bytes();

  console.info(logGroup, 'unzipping');
  const files = await unzipAsync(bytes);

  if (resolved.os === 'win32') {
    await Promise.all([
      writeBinary(logGroup, 'qjs.exe', dest + '\\qjs.exe', files['qjs.exe']),
      write(logGroup, 'libwinpthread-1.dll', dest + '\\libwinpthread-1.dll', files['libwinpthread-1.dll']),
    ]);
    return {
      bin: { 'quickjs.exe': 'qjs.exe', 'libwinpthread-1.dll': 'libwinpthread-1.dll' },
    };
  }

  await Promise.all([
    writeBinary(logGroup, 'qjs', dest + '/qjs', files.qjs),
    write(logGroup, 'run-test262', dest + '/run-test262', files['run-test262']),
  ]);
  return {
    bin: { quickjs: 'qjs', 'quickjs-run-test262': 'run-test262' },
  };
};
