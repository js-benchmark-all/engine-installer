import { relative } from 'node:path';
import type { Arch, OS } from '../engines/utils.ts';
import { constants, open, rm, type FileHandle } from 'node:fs/promises';

export interface Engine {
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
   *
   * Defaults to `.egisl`.
   */
  dir: string;

  /**
   * Installed engine binaries.
   */
  engines: Record<string, Engine>;
}

export const rmPath = async (logGroup: string, path: string): Promise<void> => {
  const relativePath = relative('.', path);
  console.info(logGroup, 'removing', path);

  try {
    await rm(relativePath);
  } catch (e) {
    console.error(logGroup, 'removing error:', e);
    return;
  }

  console.info(logGroup, 'removed', path);
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
        engines: {},
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
