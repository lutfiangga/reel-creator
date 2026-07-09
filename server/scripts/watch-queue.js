const db = require('../db/database');

let prev = new Map();

function pad(text, len) {
  const str = String(text ?? '');
  return str.length > len ? str.slice(0, len - 3) + '...' : str.padEnd(len);
}

function timestamp() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function poll() {
  const jobs = db.db.prepare(`
    SELECT rj.id, rj.project_id, rj.status, rj.progress, rj.error_message,
           rj.started_at, rj.finished_at, p.title as project_title
    FROM render_jobs rj
    LEFT JOIN projects p ON p.id = rj.project_id
    ORDER BY rj.id DESC
    LIMIT 20
  `).all();

  // Move cursor to top
  process.stdout.write('\x1b[H');

  console.log(`\x1b[1m╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║        RENDER QUEUE — Live Monitor (${timestamp()})          ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\x1b[22m`);
  console.log('');

  const header = `  \x1b[90m${pad('ID',4)} ${pad('Project',24)} ${pad('Status',12)} ${pad('Progress',9)} ${pad('Error',50)}\x1b[0m`;
  console.log(header);
  console.log(`  \x1b[90m${'─'.repeat(100)}\x1b[0m`);

  for (const job of jobs) {
    const id = String(job.id);
    const changed = prev.get(id);

    let statusColor = '\x1b[90m'; // dim
    if (job.status === 'running') statusColor = '\x1b[33m'; // yellow
    else if (job.status === 'completed') statusColor = '\x1b[32m'; // green
    else if (job.status === 'failed') statusColor = '\x1b[31m'; // red

    // Flash effect for progress changes
    const progressStr = `${job.progress ?? 0}%`;
    let progressDisplay = progressStr;
    if (changed !== undefined && changed !== job.progress) {
      progressDisplay = `\x1b[97;44m ${progressStr} \x1b[0m`; // white on blue
    } else {
      progressDisplay = pad(progressStr, 9);
    }

    const error = job.error_message ? job.error_message.slice(0, 50) : '';
    const projectName = job.project_title || `Project #${job.project_id}`;

    console.log(
      `  \x1b[90m${pad(id, 4)}\x1b[0m ` +
      `${pad(projectName, 24)} ` +
      `${statusColor}${pad(job.status, 12)}\x1b[0m ` +
      `${progressDisplay} ` +
      `${error ? '\x1b[31m' + pad(error, 50) + '\x1b[0m' : ''}`
    );

    // Track for change detection
    prev.set(id, job.progress);
  }

  console.log('');
  console.log(`  \x1b[90mListening... (Ctrl+C to stop)\x1b[0m`);
}

// Clear screen on start
process.stdout.write('\x1b[2J');

poll();
setInterval(poll, 2000);

process.on('SIGINT', () => {
  process.stdout.write('\x1b[2J\x1b[H');
  console.log('\nMonitor stopped.');
  process.exit(0);
});
