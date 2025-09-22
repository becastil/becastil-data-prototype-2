#!/usr/bin/env node
const { spawn } = require('node:child_process');
// Render injects a trailing "start" arg; drop it before delegating to Next.
const extraArgs = process.argv.slice(2);
if (extraArgs[0] === 'start') {
  extraArgs.shift();
}

const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, 'start', ...extraArgs], {
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
