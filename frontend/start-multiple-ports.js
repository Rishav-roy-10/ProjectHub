import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ports = [5173, 5174, 5175];

console.log('Starting Vite servers on multiple ports...');

ports.forEach(port => {
  const viteProcess = spawn('npx', ['vite', '--port', port.toString()], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  viteProcess.on('error', (error) => {
    console.error(`Error starting server on port ${port}:`, error);
  });

  console.log(`Server started on http://localhost:${port}/`);
});

console.log('\nAll servers are starting...');
console.log('You can access your app on:');
ports.forEach(port => {
  console.log(`- http://localhost:${port}/`);
});
