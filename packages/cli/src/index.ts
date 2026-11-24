import { BRAND } from './constants.js';

const argv = process.argv.slice(2);

if (argv.includes('--version') || argv.includes('-v')) {
  process.stdout.write('0.0.0\n');
} else {
  process.stdout.write(`${BRAND}\n`);
}
