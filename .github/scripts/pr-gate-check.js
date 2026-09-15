// Parikshak — deterministic, comment-only PR gate check bot.
//
// Runs entirely on GitHub's own runners via actions/github-script (no external
// hosting). This file never approves, closes, or requests changes on a PR — it
// only posts (or edits) a single comment describing which gates pass and fail.
// The one place Parikshak *can* close a PR is the separate scheduled job in
// parikshak-stale-check.js (48h-unresolved-conflict / unaddressed-changes-
// requested only) — this file is not that job and stays comment-only.
// See ~/Desktop/PR_REVIEW_AUTOMATION_SOP.md for the full policy: the
// fabricated-data gate needs judgment and isn't included here by design;
// this file only checks things a script can decide correctly every time.
//
// Shared byte-for-byte between vicharanashala/fln and vicharanashala/tenali —
// don't fork it per repo; add repo-specific behavior via env vars in the
// workflow file instead, so both repos stay on the same logic.

const MARKER = '<!-- parikshak:report -->';

// GitHub's own closing-keyword list: https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues-and-pull-requests/linking-a-pull-request-to-an-issue
const CLOSES_RE = /\b(close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s*#(\d+)\b/gi;

/**
 * @param {{ github: import('@octokit/rest').Octokit, context: any, core: any }} args
 */
module.exports = async ({ github, context, core }) => {
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request;
  const prNumber = pr.number;

  const findings = [];

  // --- Gate 1: PR must reference a Closes/Fixes/Resolves #N issue that exists and is open ---
  const body = pr.body || '';
  const refs = [...body.matchAll(CLOSES_RE)].map((m) => Number(m[2]));
  const uniqueRefs = [...new Set(refs)];

  if (uniqueRefs.length === 0) {
    findings.push({
      ok: false,
      title: 'No linked issue',
      detail:
        'This PR description does not contain `Closes #N` (or `Fixes #N` / `Resolves #N`) for an issue already on the tracker. ' +
        'Every PR here must map to a listed issue — nothing self-invented. Add the link and this check will re-run automatically on your next push.',
    });
  } else {
    for (const num of uniqueRefs) {
      try {
        const { data: issue } = await github.rest.issues.get({ owner, repo, issue_number: num });
        if (issue.pull_request) {
          findings.push({
            ok: false,
            title: `#${num} is a pull request, not an issue`,
            detail: `\`Closes #${num}\` must reference a tracked issue, not another PR.`,
          });
        } else if (issue.state === 'closed') {
          findings.push({
            ok: false,
            title: `#${num} is already closed`,
            detail: `The issue this PR claims to close is already closed. If this PR supersedes it, link the correct open issue instead.`,
          });
        } else {
          findings.push({ ok: true, title: `Linked to open issue #${num}`, detail: issue.title });
        }
      } catch (e) {
        findings.push({
          ok: false,
          title: `#${num} does not exist`,
          detail: `\`Closes #${num}\` references an issue that isn't on this repo's tracker. Every PR must map to a real, listed issue.`,
        });
      }
    }
  }

  // --- Gate 2: no merge conflict against the base branch ---
  // `mergeable` is null until GitHub finishes computing it; poll briefly.
  let mergeable = pr.mergeable;
  for (let attempt = 0; mergeable === null && attempt < 5; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    const { data: fresh } = await github.rest.pulls.get({ owner, repo, pull_number: prNumber });
    mergeable = fresh.mergeable;
  }
  if (mergeable === false) {
    findings.push({
      ok: false,
      title: 'Merge conflict with the base branch',
      detail: 'This PR has a merge conflict against its base branch. Rebase or merge the base in and push again — this is checked automatically, not a judgment call.',
    });
  } else if (mergeable === true) {
    findings.push({ ok: true, title: 'No merge conflict', detail: null });
  } else {
    findings.push({
      ok: null,
      title: 'Merge conflict status still unknown',
      detail: 'GitHub had not finished computing mergeability after several retries. This will be re-checked on the next push or review.',
    });
  }

  // --- Gate 3: lockfile diffs that look like unexplained dependency removals ---
  const files = await github.paginate(github.rest.pulls.listFiles, { owner, repo, pull_number: prNumber, per_page: 100 });
  const lockfiles = files.filter((f) => /(^|\/)package-lock\.json$/.test(f.filename));
  const suspicious = lockfiles.filter((f) => (f.deletions || 0) > (f.additions || 0) * 2 && f.deletions > 20);
  if (suspicious.length > 0) {
    findings.push({
      ok: false,
      title: 'Lockfile shows large, one-sided removals',
      detail:
        suspicious.map((f) => `\`${f.filename}\` (+${f.additions}/-${f.deletions})`).join(', ') +
        ' — this pattern has caused real dependency-drop incidents before. If this is intentional (a real dependency removal), say so explicitly in the PR description; otherwise check whether `npm install` was run against a stale lockfile.',
    });
  }

  // --- Post or update the single report comment ---
  const failed = findings.filter((f) => f.ok === false);
  const unknown = findings.filter((f) => f.ok === null);
  const header = failed.length > 0
    ? `### ⚠️ Parikshak — ${failed.length} issue${failed.length > 1 ? 's' : ''} found`
    : unknown.length > 0
      ? '### ⏳ Parikshak — mostly clear, one check still pending'
      : '### ✅ Parikshak — all automated checks pass';

  const lines = findings.map((f) => {
    const icon = f.ok === true ? '✅' : f.ok === false ? '❌' : '⏳';
    return `- ${icon} **${f.title}**${f.detail ? ` — ${f.detail}` : ''}`;
  });

  const footer =
    '\n\n*This is Parikshak, an automated, comment-only check — it never closes or approves a PR. ' +
    'A human reviewer still makes the final call. See `CONTRIBUTING.md` for the full contribution rules.*';

  const commentBody = `${MARKER}\n${header}\n\n${lines.join('\n')}${footer}`;

  const comments = await github.paginate(github.rest.issues.listComments, { owner, repo, issue_number: prNumber, per_page: 100 });
  const existing = comments.find((c) => c.body && c.body.startsWith(MARKER));

  if (existing) {
    await github.rest.issues.updateComment({ owner, repo, comment_id: existing.id, body: commentBody });
  } else {
    await github.rest.issues.createComment({ owner, repo, issue_number: prNumber, body: commentBody });
  }

  // Deliberately does NOT call core.setFailed() — you chose comment-only, and a
  // failed Actions run shows a red X on the PR's checks tab, which is a step
  // toward "blocking" even without branch protection turned on. If you'd
  // rather have that visual signal too, swap this for
  // `if (failed.length > 0) core.setFailed(...)`.
  core.info(`Parikshak: ${failed.length} failing / ${unknown.length} pending / ${findings.length - failed.length - unknown.length} passing gate(s) for PR #${prNumber}.`);
};
