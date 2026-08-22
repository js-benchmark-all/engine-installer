import { relative } from 'node:path';
import type { Arch, OS } from '../engines/utils/check.ts';
import { constants, open, rm, type FileHandle } from 'node:fs/promises';

export type InstalledEngines = Record<string, InstalledEngine>;

export interface InstalledEngine {
  bin: Record<string, string>;
}

export interface Config {
  /**
   * Default OS.
   */
  os?: OS;

  /**
   * Default arch.
   */
  arch?: Arch;

  /**
   * Directory path to install engines, relative to this config file.
   * @example
   * {
   *   "dir": ".egisl"
   * }
   *
   * {
   *   // special syntax, equivalent to "$HOME/.egisl"
   *   "dir": "~/.egisl"
   * }
   */
  dir: string;

  /**
   * Installed engines.
   */
  engines?: InstalledEngines;
}

export type ModifiedConfig = {
  [K in keyof Config]-?: Config[K];
};

export const readConfig = async (
  path: string,
): Promise<{
  handle: FileHandle;
  data: Config;
}> => {
  const handle = await open(path, constants.O_CREAT | constants.O_RDWR);

  try {
    return {
      handle,
      data: JSON.parse(await handle.readFile('utf8')) as Config,
    };
  } catch {
    return {
      handle,
      data: {
        dir: '.egisl',
      },
    };
  }
};

export const closeConfig = async ({
  handle,
  data,
}: {
  handle: FileHandle;
  data: Config;
}): ReturnType<FileHandle['close']> => {
  try {
    const writeResult = await handle.write(JSON.stringify(data, null, 2), 0);
    await handle.truncate(writeResult.bytesWritten);
  } finally {
    return handle.close();
  }
};
