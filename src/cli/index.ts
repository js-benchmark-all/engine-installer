#!/usr/bin/env node
import { join, relative, sep } from 'node:path';
import { accessSync, constants } from 'node:fs';

import { closeConfig, readConfig, type ModifiedConfig } from './config.ts';
import { install, load } from './install.ts';
import { homedir } from 'node:os';
import { assertArch, assertOS } from '../engines/utils/check.ts';

const { argv } = process;

const help_help = `
  help: print this help menu.
  help [command]: print help menu of a specific command.`;

const init_help = `
  init: create config file if not exists, else install all engines specified.`;

const add_help = `
  add [...engines]: install engines.`;

const use_help = `
  use [...engines]: symlink binaries of engines.
  use-all: symlink all binaries.`;

if (argv.length < 3 || argv[2] === 'help') {
  console.log('usage: egisl [command] [...args]\ncommands:');
  if (argv.length === 3) console.log(help_help + add_help + use_help);
  else if (argv[3] === 'init') console.log(init_help);
  else if (argv[3] === 'add') console.log(add_help);
  else if (argv[3] === 'use' || argv[3] === 'use-all') console.log(use_help);
  else throw new Error(`unknown command: ${argv[3]}\n to list commands: egisl help`);
} else
  (async () => {
    let configPath = 'egisl.json';

    // Resolve egisl.json from parent directory
    if (argv[2] !== 'init') {
      console.info('resolving egisl.json');

      configPath = process.cwd();
      configPath.endsWith(sep) && (configPath = configPath.slice(0, -1));

      while (true) {
        try {
          const finalPath = configPath + sep + 'egisl.json';
          accessSync(finalPath, constants.W_OK | constants.R_OK);
          console.log('resolved egisl.json at', relative('.', finalPath));

          configPath = finalPath;
          break;
        } catch {
          if (configPath === '') {
            console.error('egisl.json not found');
            process.exit(1);
          }

          const idx = configPath.lastIndexOf(sep);
          configPath = configPath.slice(0, idx);
        }
      }
    }

    const config = await readConfig(configPath),
      { data } = config,
      promises: Promise<void>[] = [];

    // Modify default
    assertOS((data.os ??= process.platform as any));
    assertArch((data.arch ??= process.arch as any));
    data.engines ??= {};

    // Special dir syntax
    const originalDir = data.dir;
    originalDir.startsWith('~' + sep) && (data.dir = join(homedir(), originalDir.slice(1 + sep.length)));

    if (argv[2] === 'init')
      for (const runtime in data.engines) promises.push(install(runtime, data as ModifiedConfig));
    else if (argv[2] === 'add')
      for (let i = 3; i < argv.length; i++) promises.push(install(argv[i], data as ModifiedConfig));
    else if (argv[2] === 'use')
      for (let i = 3; i < argv.length; i++) promises.push(load(argv[i], data as ModifiedConfig));
    else if (argv[2] === 'use-all')
      for (const key in data.engines as ModifiedConfig['engines'])
        promises.push(load(key, data as ModifiedConfig));

    await Promise.all(promises);

    data.dir = originalDir;
    await closeConfig(config);
  })();
