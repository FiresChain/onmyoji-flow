# Asset Sync Scripts

## Install

```bash
cd scripts
npm install
```

## Commands

```bash
# sync all libraries (shikigami + yuhun; onmyoji/onmyojiSkill are manual-only)
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
- Backup file: `src/data/assets/*.json.bak` (overwrite single backup before write)
- Yuhun official images: `public/assets/Yuhun/*.png`

## Strategy

- `shikigami`: official API parse -> schema validate -> write JSON + download avatars
- `yuhun`: official image probe only, download images only, do not modify `yuhun.json`
- `onmyoji` / `onmyojiSkill`: manual-only, script skips with warning
- No fallback snapshots; official parse failure is treated as hard failure
- JSON writes use single-file backup (`.bak`) + atomic replace
