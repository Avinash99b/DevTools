// End-to-end smoke test for the backend security fixes.
// Run with: ACCESS_SECRET=test DB_PATH=/tmp/opencode/devtools-test.db STORAGE_PATH=/tmp/opencode/storage-test node scripts/smoke.js
// Smoke test port is configurable via TEST_PORT.
const base = `http://localhost:${process.env.TEST_PORT || process.env.PORT || 3210}`;

async function main() {
    const results = [];
    const check = (name, cond, detail) => { results.push({ name, pass: !!cond, detail }); };

    // 1. Unauthenticated access must be rejected
    let r = await fetch(`${base}/api/jobs`);
    check('unauthenticated request rejected', r.status === 401, `status=${r.status}`);

    // 2. Forged cookie must be rejected (server-side session validation)
    r = await fetch(`${base}/api/jobs`, { headers: { cookie: 'sessionId=forged-value' } });
    check('forged session cookie rejected', r.status === 401, `status=${r.status}`);

    // 3. Login with wrong secret
    r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: 'nope' }) });
    check('bad secret rejected', r.status === 401, `status=${r.status}`);

    // 4. Login with correct secret
    r = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: 'test-secret' }) });
    const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
    check('login succeeds and sets cookie', r.status === 200 && cookie.startsWith('sessionId='), `${r.status} ${cookie}`);
    const auth = { cookie, 'content-type': 'application/json' };

    // 5. Authenticated listing works
    r = await fetch(`${base}/api/jobs`, { headers: auth });
    check('authenticated job listing', r.status === 200, `status=${r.status}`);

    // 6. SSRF: localhost blocked
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'proxy-downloader-tool', data: { url: 'http://127.0.0.1:3210/api/health' } }) });
    const ssrf1 = await r.json();
    check('SSRF localhost blocked', r.status === 400 && /private/i.test(ssrf1.error), `${r.status} ${JSON.stringify(ssrf1)}`);

    // 7. SSRF: metadata IP blocked
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'proxy-downloader-tool', data: { url: 'http://169.254.169.254/latest/meta-data/' } }) });
    const ssrf2 = await r.json();
    check('SSRF cloud metadata blocked', r.status === 400, `${r.status} ${JSON.stringify(ssrf2)}`);

    // 8. SSRF: IPv6 loopback blocked
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'proxy-downloader-tool', data: { url: 'http://[::1]:3210/' } }) });
    const ssrf3 = await r.json();
    check('SSRF IPv6 loopback blocked', r.status === 400, `${r.status} ${JSON.stringify(ssrf3)}`);

    // 9. SSRF: IPv4-mapped IPv6 loopback blocked
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'proxy-downloader-tool', data: { url: 'http://[::ffff:127.0.0.1]:3210/' } }) });
    const ssrf4 = await r.json();
    check('SSRF IPv4-mapped loopback blocked', r.status === 400, `${r.status} ${JSON.stringify(ssrf4)}`);

    // 10. Invalid scheme blocked
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'proxy-downloader-tool', data: { url: 'file:///etc/passwd' } }) });
    const ssrf5 = await r.json();
    check('non-http scheme blocked', r.status === 400, `${r.status} ${JSON.stringify(ssrf5)}`);

    // 11. Unknown tool
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'nope', data: {} }) });
    check('unknown tool rejected', r.status === 404, `status=${r.status}`);

    // 12. Missing toolId
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ data: {} }) });
    check('missing toolId rejected', r.status === 400, `status=${r.status}`);

    // 13. Token estimator input bound
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'token-estimator-tool', data: { text: 'hello world' } }) });
    const tok = await r.json();
    check('token estimator works', r.status === 200 && tok.result?.tokens > 0, `status=${r.status}`);

    // 14. Async extract-audio rejects unknown/traversal format (validated in worker)
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'extract-audio-tool', data: { fileId: 'x', format: '../evil' } }) });
    const badJob = await r.json();
    let badDone = null;
    for (let i = 0; i < 20; i++) {
        await new Promise((res) => setTimeout(res, 200));
        const rr = await fetch(`${base}/api/jobs/${badJob.jobId}`, { headers: auth });
        badDone = await rr.json();
        if (badDone.status === 'error' || badDone.status === 'completed') break;
    }
    check('extract-audio rejects bad format', badDone?.status === 'error' && !/evil/.test(JSON.stringify(badDone)), JSON.stringify(badDone));

    // 15. Async job lifecycle: submit dummy, poll to completion
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'dummy-async-tool', data: { a: 1 } }) });
    const job = await r.json();
    check('async job accepted', r.status === 202 && job.status === 'pending', `${r.status} ${JSON.stringify(job)}`);
    let done = null;
    for (let i = 0; i < 20; i++) {
        await new Promise((res) => setTimeout(res, 300));
        const rr = await fetch(`${base}/api/jobs/${job.jobId}`, { headers: auth });
        done = await rr.json();
        if (done.status === 'completed' || done.status === 'error') break;
    }
    check('async job completes', done?.status === 'completed', JSON.stringify(done));

    // 16. Cancel an async job
    r = await fetch(`${base}/api/jobs`, { method: 'POST', headers: auth, body: JSON.stringify({ toolId: 'dummy-async-tool', data: {} }) });
    const job2 = await r.json();
    r = await fetch(`${base}/api/jobs/${job2.jobId}`, { method: 'DELETE', headers: auth });
    check('job cancel accepted', r.status === 200, `status=${r.status}`);

    // 17. Upload rejection: unsupported type
    const form = new FormData();
    form.append('file', new Blob([Buffer.from('#!/bin/sh\necho hi')], { type: 'application/x-sh' }), 'evil.sh');
    r = await fetch(`${base}/api/files/upload`, { method: 'POST', headers: { cookie }, body: form });
    check('unsupported upload type rejected', r.status === 400, `status=${r.status}`);

    // 18. Oversized upload rejected (default limit 10MB)
    const big = new Blob([Buffer.alloc(11 * 1024 * 1024, 1)], { type: 'video/mp4' });
    const form2 = new FormData();
    form2.append('file', big, 'big.mp4');
    r = await fetch(`${base}/api/files/upload`, { method: 'POST', headers: { cookie }, body: form2 });
    check('oversized upload rejected with 413', r.status === 413, `status=${r.status}`);

    // 19. Logout invalidates session server-side
    r = await fetch(`${base}/api/logout`, { method: 'POST', headers: auth });
    check('logout succeeds', r.status === 200, `status=${r.status}`);
    r = await fetch(`${base}/api/jobs`, { headers: auth });
    check('session invalid after logout', r.status === 401, `status=${r.status}`);

    const failed = results.filter((x) => !x.pass);
    for (const x of results) console.log(`${x.pass ? 'PASS' : 'FAIL'}  ${x.name}  ${x.pass ? '' : '-> ' + x.detail}`);
    console.log(`\n${results.length - failed.length}/${results.length} passed`);
    process.exit(failed.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });