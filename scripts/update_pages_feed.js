const { Octokit } = require('@octokit/rest');
const { randomUUID } = require('crypto');
(async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('Missing GITHUB_TOKEN');
    const octokit = new Octokit({ auth: token });
    const repoFull = process.env.GITHUB_REPOSITORY || '';
    const [ownerCtx, repoCtx] = repoFull.split('/');
    const owner = process.env.OWNER || ownerCtx;
    const repo = process.env.REPO || repoCtx;
    const branch = process.env.BRANCH || 'main';
    const path = 'data/qa-results.json';
    let sha = null; let arr = [];
    try { const res = await octokit.repos.getContent({ owner, repo, path, ref: branch }); sha = res.data.sha; if (res.data.content) { const decoded = Buffer.from(res.data.content, 'base64').toString('utf8'); let parsed = null; try { parsed = JSON.parse(decoded); } catch {} if (parsed == null) arr = []; else if (Array.isArray(parsed)) arr = parsed; else if (typeof parsed === 'object') arr = [parsed]; else arr = []; } } catch (e) { if (e.status === 404) { arr = []; } else { throw e; } }
    const entry = { id: randomUUID(), repo, ts: new Date().toISOString(), status: 'ok', summary: 'Automated QA heartbeat' };
    arr.push(entry);
    const newJson = JSON.stringify(arr, null, 2);
    const contentB64 = Buffer.from(newJson, 'utf8').toString('base64');
    const putRes = await octokit.repos.createOrUpdateFileContents({ owner, repo, path, message: 'Update QA feed: append heartbeat (GitHub Actions)', content: contentB64, branch, sha: sha || undefined });
    console.log(Updated aldenarends2/  -> );
  } catch (err) { console.error('Updater failed:', err.status || '', err.message || err); process.exit(1); }
})();