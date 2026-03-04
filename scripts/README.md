# Asset Sync Scripts

## Install

```bash
cd scripts
npm install
```

## Commands

```bash
# sync all libraries
npm run sync-assets

# sync one library
npm run sync-assets:shikigami
npm run sync-assets:yuhun
npm run sync-assets:onmyoji
npm run sync-assets:onmyojiSkill

# verify generated assets
npm run verify-assets
```

## Optional flags

```bash
node sync-assets.js --library all --dry-run
node sync-assets.js --library shikigami --no-download
node sync-assets.js --library all --prune
node sync-assets.js --library all --report ../tmp/asset-sync-report.json
```

## Output

- Static data: `src/data/assets/*.json`
- Manifest: `src/data/assets/manifest.json`
- Fallback snapshots: `scripts/fallback/*.json`

## Strategy

- Official source first
- Fallback snapshot when official parser fails
- Schema validation before write
- Atomic file write for data outputs
