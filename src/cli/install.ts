import type { Arch, OS } from '../engines/utils.ts';
import type { Config, InstalledEngine } from './config.ts';

export interface ResolvedId {
  id: string;
  version: string;
  arch: Arch;
  os: OS;
}
export type Resolver = (id: string) => Promise<ResolvedId>;
export type Installer = (
  logGroup: string,
  resolved: ResolvedId,
  dest: string,
) => Promise<InstalledEngine>;

export const runInstall = async (
  engine: string,
  o: { install: Installer; resolve: Resolver },
  version: string,
  config: Config,
): Promise<void> => {
  let logGroup = '[' + engine + ']';

  try {
    console.info(logGroup, 'resolving', version);
    const resolved = await o.resolve(version),
      { id } = resolved;
    version === id || console.info(logGroup, 'resolved', version, '->', id);

    logGroup = `[${engine}@${id}]`;

    const old = config.engines[engine]?.[id];
    if (old) console.info(logGroup, 'already installed');
    else (config.engines[engine] ??= {})[id] = await o.install(logGroup, resolved, config.dir);

    console.info(logGroup, 'done :>');
  } catch (e) {
    console.error(logGroup, 'error:', e);
  }
};

export const install = async (name: string, config: Config): Promise<void> => {
  const { 0: engine, 1: version = 'latest' } = name.split('@');

  if (engine === 'llrt')
    return runInstall('llrt', await import('../engines/llrt.js'), version, config);
  else if (engine === 'quickjs')
    return runInstall('quickjs', await import('../engines/quickjs.js'), version, config);
  else console.error('unknown engine:', engine, '(installer supports llrt, quickjs)');
};
