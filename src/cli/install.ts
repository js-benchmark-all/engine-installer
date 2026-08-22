import { join, relative, sep } from 'node:path';
import { mkdir } from 'node:fs/promises';

import type { Arch, OS } from '../engines/utils/check.ts';
import type { ModifiedConfig, InstalledEngine } from './config.ts';
import { symlinkTo } from '../engines/utils/fs.ts';

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
      const configDir = relative('.', config.dir);
      promises.push(
        symlinkTo(logGroup, configDir + sep + key, configDir + sep + name + sep + bin[key]),
      );
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

    const dest = relative('.', join(config.dir, engine));
    if (await mkdir(dest, { recursive: true })) {
      console.info(logGroup, 'installing');
      config.engines[engine] = await o.install(logGroup, resolved, dest);
    } else console.info(logGroup, 'already installed');

    console.info(logGroup, 'done :>');

    return load(engine, config);
  } catch (e) {
    console.error(logGroup, 'install error:', e);
  }
};

export const install = async (name: string, config: ModifiedConfig): Promise<void> => {
  const { 0: engine, 1: version = 'latest' } = name.split('@');

  try {
    return runInstall(engine, await import(`../engines/${engine}.js`), version, config);
  } catch {
    console.error('unknown engine:', engine, '(installer supports llrt, quickjs, porffor)');
  }
};
