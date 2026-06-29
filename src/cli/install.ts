import type { Config, Engine } from './config.ts';
import { parse } from './name.ts';

export type Installer = (logGroup: string, id: string, dest: string) => Promise<Engine>;

export const install = async (name: string, config: Config): Promise<void> => {
  const { engine, version, id } = parse(name);
  const logGroup = '[' + id + ']';

  let p: ReturnType<Installer>;
  if (engine === 'llrt')
    p = (await import('../engines/llrt.js')).install(logGroup, version, config.dir);
  else if (engine === 'quickjs')
    p = (await import('../engines/quickjs.js')).install(logGroup, version, config.dir);
  else {
    console.error('unknown engine:', engine);
    return;
  }

  try {
    config.engines[id] = await p;
    console.info(logGroup, 'done :>');
  } catch (e) {
    console.error(logGroup, 'install error:', e);
  }
};
