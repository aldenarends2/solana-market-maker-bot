const { Octokit } = require("@octokit/rest");
const { randomUUID } = require("crypto");

(async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const ownerRepo = process.env.GITHUB_REPOSITORY || process.env.REPO || "";
    const [owner, repo] = ownerRepo ? ownerRepo.split("/") : [process.env.OWNER, process.env.REPO_NAME];
    const octokit = new Octokit({ auth: token });

    const path = "data/qa-results.json";
    let arr = [];
    try {
      const res = await octokit.repos.getContent({ owner, repo, path });
      const parsed = JSON.parse(Buffer.from(res.data.content, "base64").toString("utf8"));
      if (Array.isArray(parsed)) arr = parsed; else if (typeof parsed === "object") arr = [parsed]; else arr = [];
    } catch (e) {
      if (e.status === 404) { arr = []; } else { throw e; }
    }

    const status = process.env.STATUS || "ok";
    const summary = process.env.SUMMARY || (status === "ok" ? "Automated QA heartbeat" : "Automated QA heartbeat - smoke failed");

    const entry = { id: randomUUID(), repo, ts: new Date().toISOString(), status, summary };
    arr.push(entry);

    const newJson = JSON.stringify(arr, null, 2);
    const contentB64 = Buffer.from(newJson, "utf8").toString("base64");

    // Try to update existing file; fetch SHA if present
    let sha;
    try {
      const res = await octokit.repos.getContent({ owner, repo, path });
      sha = res.data.sha;
    } catch (e) {}

    const putRes = await await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', { owner, repo, path, message: 'Update QA feed: heartbeat (GitHub Actions)', content: contentB64, branch: 'main', sha: sha || undefined });
    console.log(`${repo} feed updated`);
  } catch (err) {
    console.error("Updater failed:", err.status || "", err.message || err);
    process.exit(1);
  }
})();