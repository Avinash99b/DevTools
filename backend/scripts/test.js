// Boots the compiled server against an isolated SQLite DB/storage dir, runs the
// smoke suite, then tears everything down. Used by `npm test`.
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'devtools-test-'));
const port = process.env.TEST_PORT || '3299';
const env = {
    ...process.env,
    ACCESS_SECRET: 'test-secret',
    DB_PATH: path.join(tmpRoot, 'devtools.db'),
    STORAGE_PATH: path.join(tmpRoot, 'storage'),
    PORT: port,
    NODE_ENV: 'test',
};

const server = spawn(process.execPath, [path.join(__dirname, '..', 'dist', 'server.js')], { env, stdio: 'inherit' });

const waitForHealth = async () => {
    for (let i = 0; i < 50; i++) {
        try {
            const res = await fetch(`http://localhost:${port}/api/health`);
            if (res.ok) return true;
        } catch { /* retry */ }
        await new Promise((r) => setTimeout(r, 200));
    }
    return false;
};

const cleanup = () => {
    server.kill('SIGTERM');
    try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch { /* ignore */ }
};

(async () => {
    if (!(await waitForHealth())) {
        console.error('Server failed to start.');
        cleanup();
        process.exit(1);
    }
    const smoke = spawn(process.execPath, [path.join(__dirname, 'smoke.js')], {
        env: { ...env, TEST_PORT: port },
        stdio: 'inherit',
    });
    smoke.on('exit', (code) => {
        cleanup();
        process.exit(code ?? 1);
    });
})();