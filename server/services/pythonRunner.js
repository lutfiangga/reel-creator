const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

function runPython(scriptName, args = [], onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '..', '..', 'python', scriptName);
    const venv = path.join(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
    const python = fs.existsSync(venv) ? venv : (process.platform === 'win32' ? 'python' : 'python3');
    const child = spawn(python, [script, ...args], { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      const match = text.match(/PROGRESS\s+(\d+)/);
      if (match) onProgress(Number(match[1]));
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code) return reject(new Error(stderr || `Python exited with ${code}`));
      const last = stdout.trim().split(/\r?\n/).filter(Boolean).pop() || '{}';
      try { resolve(JSON.parse(last)); } catch { resolve({ output: stdout.trim() }); }
    });
  });
}

module.exports = { runPython };
