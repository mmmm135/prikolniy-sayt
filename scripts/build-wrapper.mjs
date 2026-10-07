import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
process.env.npm_execpath ||= 'C:/nvm4w/nodejs/node_modules/npm/bin/npm-cli.js';
if (process.platform === 'win32') {
 // Pin the package-manager shim to this runtime; the system shim resolves its prefix incorrectly here.
 const shimDirectory = path.resolve('.sites-runtime/build-bin');
 mkdirSync(shimDirectory, {recursive: true});
 writeFileSync(path.join(shimDirectory, 'npm.cmd'), `@echo off\r\n"${process.execPath}" "${process.env.npm_execpath}" %*\r\n`);
 process.env.PATH = `${shimDirectory};${path.dirname(process.execPath)};${process.env.PATH}`;
}
await import(pathToFileURL('C:/Users/User/.codex/plugins/cache/openai-curated-remote/sites/0.1.75/scripts/build-site.mjs').href);
