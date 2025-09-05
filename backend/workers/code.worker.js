import { Worker } from 'bullmq';
import codeExecutionService from '../services/code-execution.service.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

export const codeWorker = new Worker('code-exec', async (job) => {
  const { sourceCode, language, input } = job.data;
  const lang = (language || '').toLowerCase();

  if (['html','css','javascript','js'].includes(lang)) {
    return {
      type: 'iframe',
      content: codeExecutionService.generateIframeContent(sourceCode, language)
    };
  }

  // If Docker is enabled and Node code likely needs npm packages, run inside container
  const dockerEnabled = (process.env.DOCKER_ENABLED || 'false').toLowerCase() === 'true';
  const looksLikeNodeServer = lang === 'javascript' || lang === 'node' || lang === 'js';
  if (dockerEnabled && looksLikeNodeServer) {
    const output = await runNodeInDocker(sourceCode, input);
    return { type: 'api', result: output };
  }

  const result = await codeExecutionService.executeCode(sourceCode, language, input);
  return { type: 'api', result };
}, { connection });

codeWorker.on('failed', (job, err) => {
  console.error('Code job failed:', job?.id, err);
});

export default codeWorker;

function detectNpmPackages(code) {
  const packages = new Set();
  const requireRegex = /require\(['"]([^'"/\.]+)['"]\)/g; // bare module names only
  const importRegex = /from\s+['"]([^'"/\.]+)['"]/g;
  let m;
  while ((m = requireRegex.exec(code))) packages.add(m[1]);
  while ((m = importRegex.exec(code))) packages.add(m[1]);
  return Array.from(packages);
}

function execAsync(cmd, opts) {
  return new Promise((resolve) => {
    exec(cmd, { ...opts, windowsHide: true }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

async function runNodeInDocker(sourceCode, input) {
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'code-run-'));
  const scriptPath = path.join(workDir, 'script.js');
  fs.writeFileSync(scriptPath, sourceCode, 'utf8');

  const pkgs = detectNpmPackages(sourceCode);
  const installCmd = pkgs.length ? `npm init -y >/dev/null 2>&1 && npm i -s ${pkgs.join(' ')} >/dev/null 2>&1` : 'npm init -y >/dev/null 2>&1';

  // Compose Docker command (works with Docker Desktop)
  const dockerCmd = `docker run --rm -v "${workDir.replace(/\\/g, '/')}:/app" -w /app node:18-alpine sh -lc "${installCmd} && node script.js"`;
  const { error, stdout, stderr } = await execAsync(dockerCmd);

  const output = {
    success: !error,
    status: error ? 'Runtime Error' : 'Success',
    output: stdout || '',
    error: stderr || (error ? String(error) : ''),
  };

  // Cleanup best-effort
  try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}

  return output;
}


