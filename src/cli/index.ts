#!/usr/bin/env node
import { closeConfig, readConfig } from './config.ts';
import { install } from './install.ts';

const { argv } = process;

const help_help = `
  help: print this help menu.
  help [command]: print help menu of a specific command.`;

const init_help = `
  init: create config file if not exists, else install all engines specified.`;

const add_help = `
  add [...engines]: install engines.`;

const remove_help = `
  remove [...engines]: remove engines.`;

if (argv.length < 3 || argv[2] === 'help') {
  console.log('usage: egisl [command] [...args]\ncommands:');
  if (argv.length === 3) console.log(help_help + add_help + remove_help);
  else if (argv[3] === 'init') console.log(init_help);
  else if (argv[3] === 'add') console.log(add_help);
  else if (argv[3] === 'remove') console.log(remove_help);
  else throw new Error(`unknown command: ${argv[3]}\n to list commands: egisl help`);
} else if (argv[2] === 'init') {
  const config = await readConfig('./egisl.json'),
    { data } = config;

  const promises = [];
  for (const runtime in data.engines) promises.push(install(runtime, data));
  await Promise.all(promises);

  await closeConfig(config);
} else if (argv[2] === 'add') {
  const config = await readConfig('./egisl.json'),
    { data } = config;

  const promises = [];
  for (let i = 3; i < argv.length; i++) promises.push(install(argv[i], data));
  await Promise.all(promises);

  await closeConfig(config);
}
