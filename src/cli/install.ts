import { join, relative, sep } from 'node:path';
import { mkdir, symlink } from 'node:fs/promises';

import type { Arch, OS } from '../engines/utils.ts';
import type { ModifiedConfig, InstalledEngine } from './config.ts';

export interface ResolvedId {
  version: string;
  arch: Arch;
  os: OS;
}
export type Resolver = (id: string, config: ModifiedConfig) => Promise<ResolvedId>;
export type Installer = (
  logGroup: string,
  resolved: ResolvedId,
  dest: string,
) => Promise<InstalledEngine>;

export const load = async (name: string, config: ModifiedConfig): Promise<any> => {
  const engine = config.engines[name];
  if (engine == null) {
    console.error('engine', name, 'does not exist!');
    return;
  }

  const logGroup = `[${name}]`,
    { bin } = engine;

  try {
    const promises: Promise<void>[] = [];

    for (let key in bin) {
      const binPath = join(config.dir, key),
        enginePath = join(config.dir, name + sep + bin[key]);

      console.info(logGroup, 'symlink', relative('.', enginePath), 'to', relative('.', binPath));
      promises.push(symlink(enginePath, binPath));
    }

    await Promise.all(promises);
    console.info(logGroup, 'loaded');
  } catch (e) {
    console.error(logGroup, 'load error:', e);
  }
};

export const runInstall = async (
  engine: string,
  o: { install: Installer; resolve: Resolver },
  version: string,
  config: ModifiedConfig,
): Promise<void> => {
  let logGroup = '[' + engine + ']';

  try {
    console.info(logGroup, 'resolving', version);
    const resolved = await o.resolve(version, config),
      id = resolved.version + `_${resolved.os}_` + resolved.arch;
    console.info(logGroup, 'resolved', version, '->', id);

    engine += '@' + id;
    logGroup = `[${engine}]`;

    const dest = join(config.dir, engine);
    if (await mkdir(dest, { recursive: true })) {
      console.info(logGroup, 'installing');
      config.engines[engine] = await o.install(logGroup, resolved, dest);
    } else console.info(logGroup, 'already installed');

    console.info(logGroup, 'done :>');
  } catch (e) {
    console.error(logGroup, 'install error:', e);
  }
};

export const install = async (name: string, config: ModifiedConfig): Promise<void> => {
  const { 0: engine, 1: version = 'latest' } = name.split('@');

  if (engine === 'llrt')
    return runInstall('llrt', await import('../engines/llrt.js'), version, config);
  else if (engine === 'quickjs')
    return runInstall('quickjs', await import('../engines/quickjs.js'), version, config);
  else console.error('unknown engine:', engine, '(installer supports llrt, quickjs)');
};
