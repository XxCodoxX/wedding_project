This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Releases & versioning

Versions follow [Semantic Versioning](https://semver.org) and are derived from the
[Conventional Commit](https://www.conventionalcommits.org) messages (`feat:`, `fix:`, `perf:` …):

| Commits since last release | Bump |
|---|---|
| `fix:` / `perf:` only | patch — `1.0.0 → 1.0.1` |
| any `feat:` | minor — `1.0.0 → 1.1.0` |
| `feat!:` or a `BREAKING CHANGE:` footer | major — `1.0.0 → 2.0.0` |

**Releases are automatic** ([semantic-release](https://semantic-release.gitbook.io), config in
`.releaserc.json`). Every push to `main` runs `.github/workflows/release.yml`: if there are
`feat:` / `fix:` / `perf:` (or breaking) commits since the last tag, it tags the next version
(`vX.Y.Z`) and publishes a GitHub Release with the notes. Pushes with only `docs:` / `chore:` /
`refactor:` etc. don't release; they ride along in the next one.

Nothing is committed back to `main` — the version lives only in the git tag — so there is no need
to pull after a release. Release notes are on the repo's **Releases** page (`CHANGELOG.md` only
covers releases up to v1.1.1).

Vercel deploys every push to `main` as usual. The admin sidebar shows the deployed commit; match it
to a version on the Releases page.
