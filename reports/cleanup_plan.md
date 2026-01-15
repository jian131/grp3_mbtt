# JFinder Cleanup Plan

**Generated:** 2026-01-16
**Author:** Senior Engineer / Repo Maintainer

## 1. Summary

Total files to delete: **17 files**
Estimated cleanup: Remove ~2000 lines of dead code

## 2. Deletion Categories

### Category A: Dead Code Components (No Imports)

| File                            | Evidence                                  | Action     |
| ------------------------------- | ----------------------------------------- | ---------- |
| `app/components/LeafletMap.tsx` | `grep "LeafletMap"` → only self-reference | **DELETE** |
| `components/Map/JFinderMap.tsx` | `grep "JFinderMap"` → only self-reference | **DELETE** |
| `components/Map/mapStyles.ts`   | Only imported by JFinderMap.tsx           | **DELETE** |

**Evidence:**

```bash
$ grep -r "LeafletMap" --include="*.tsx" --include="*.ts"
# Result: Only app/components/LeafletMap.tsx:export default function LeafletMap

$ grep -r "JFinderMap" --include="*.tsx" --include="*.ts"
# Result: Only components/Map/JFinderMap.tsx:export default function JFinderMap

$ grep -r "mapStyles" --include="*.tsx" --include="*.ts"
# Result: Only components/Map/JFinderMap.tsx:import { mapStyles }
```

### Category B: Deprecated n8n Workflows

| File                         | Reason                                            | Action     |
| ---------------------------- | ------------------------------------------------- | ---------- |
| `n8n/0-init-schema.json`     | Creates Postgres tables, system is now file-based | **DELETE** |
| `n8n/1-import-data.json`     | Imports to Postgres, not needed                   | **DELETE** |
| `n8n/ALL_APIS_workflow.json` | Old workflow with Postgres queries                | **DELETE** |

**Kept:** `n8n/JFinder_API_NoPostgres.json` - This is the active workflow.

### Category C: Unused Scripts

| File                                   | Evidence                               | Action     |
| -------------------------------------- | -------------------------------------- | ---------- |
| `setup_n8n.py`                         | `grep "setup_n8n"` → 0 matches         | **DELETE** |
| `test-apis.bat`                        | `grep "test-apis"` → 0 matches         | **DELETE** |
| `scripts/import_to_superset.py`        | Failed approach, used Postgres instead | **DELETE** |
| `scripts/upload_to_superset_manual.md` | Outdated guide                         | **DELETE** |

### Category D: Unverified/Duplicate Data

| File                              | Reason                                         | Action     |
| --------------------------------- | ---------------------------------------------- | ---------- |
| `app/data/vn_rental_3cities.json` | Unverified data (2500 records, geo mismatches) | **DELETE** |
| `app/data/vn_rental_3cities.csv`  | CSV version of unverified data                 | **DELETE** |

**Kept:**

- `app/data/vn_rental_3cities_verified.json` (1170 records, 100% verified)
- `app/data/vn_rental_3cities_verified.csv` (backup)

### Category E: Empty/Unnecessary Folders

| Path           | Reason       | Action     |
| -------------- | ------------ | ---------- |
| `data/` (root) | Empty folder | **DELETE** |

### Category F: Obsolete Root Files

| File                  | Reason                                       | Action                |
| --------------------- | -------------------------------------------- | --------------------- |
| `Dockerfile.superset` | Build failed, using base image + apt install | **DELETE**            |
| `STATUS.md`           | Outdated status report                       | **DELETE**            |
| `SETUP.md`            | Consolidate into README                      | **MERGE then DELETE** |
| `SYSTEM_OVERVIEW.md`  | Consolidate into README                      | **MERGE then DELETE** |

---

## 3. Execution Script

### Step 1: Create Backup

```powershell
# Create backup before cleanup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Compress-Archive -Path "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt" -DestinationPath "grp3_mbtt_backup_$timestamp.zip"
```

### Step 2: Delete Dead Code

```powershell
# Category A: Dead components
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\app\components\LeafletMap.tsx"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\components\Map\JFinderMap.tsx"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\components\Map\mapStyles.ts"
```

### Step 3: Delete Deprecated Workflows

```powershell
# Category B: Old n8n workflows
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\n8n\0-init-schema.json"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\n8n\1-import-data.json"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\n8n\ALL_APIS_workflow.json"
```

### Step 4: Delete Unused Scripts

```powershell
# Category C: Unused scripts
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\setup_n8n.py"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\test-apis.bat"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\scripts\import_to_superset.py"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\scripts\upload_to_superset_manual.md"
```

### Step 5: Delete Unverified Data

```powershell
# Category D: Unverified data
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\app\data\vn_rental_3cities.json"
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\app\data\vn_rental_3cities.csv"
```

### Step 6: Delete Empty Folders

```powershell
# Category E: Empty folder
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\data" -Recurse -ErrorAction SilentlyContinue
```

### Step 7: Delete Obsolete Files

```powershell
# Category F: Obsolete files
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\Dockerfile.superset" -ErrorAction SilentlyContinue
Remove-Item "c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt\STATUS.md"
# SETUP.md and SYSTEM_OVERVIEW.md: Review first, then delete after merging into README
```

---

## 4. Post-Cleanup Verification

### Build Check

```powershell
cd c:\Users\User\OneDrive\Documents\VSCode\HTTM\grp3_mbtt
npm run build
```

Expected: No import errors for deleted files.

### Service Check

```powershell
# n8n should still work
Invoke-RestMethod -Uri "http://localhost:5678/webhook/search?limit=1"

# Frontend should start
npm run dev
```

### Grep Verification

```powershell
# No broken imports
Select-String -Path "**/*.tsx","**/*.ts" -Pattern "LeafletMap|JFinderMap|mapStyles" -Recurse
# Expected: 0 matches
```

---

## 5. Files Confirmed SAFE (Do NOT Delete)

| File                                    | Usage Count | Imported By                |
| --------------------------------------- | ----------- | -------------------------- |
| `lib/api.ts`                            | 10+         | All pages                  |
| `lib/districts.ts`                      | 3           | search, landlord, analysis |
| `components/FallbackImage.tsx`          | 11          | search, ImageGallery       |
| `components/Listing/ImageGallery.tsx`   | 6           | listing detail             |
| `components/Analysis/ValuationCard.tsx` | 8           | analysis, landlord         |
| `components/Map/RentalHeatmap.tsx`      | 7           | search, listing detail     |
| `n8n/JFinder_API_NoPostgres.json`       | 1           | Active workflow            |
| `scripts/geo_normalize.py`              | 1           | Data prep                  |
| `scripts/import_to_postgres.py`         | 1           | Superset data              |

---

## 6. Risk Assessment

| Risk                          | Mitigation                                                |
| ----------------------------- | --------------------------------------------------------- |
| Accidentally delete used file | All deletions verified with grep first                    |
| Break n8n workflow            | Only deleting deprecated workflows, active workflow kept  |
| Break FE build                | Will run `npm run build` post-cleanup                     |
| Lose data                     | `jfinder_data.db` kept, can regenerate from verified JSON |

---

## 7. Approval Checklist

- [ ] Backup created
- [ ] grep evidence reviewed for each file
- [ ] Category A deletions approved
- [ ] Category B deletions approved
- [ ] Category C deletions approved
- [ ] Category D deletions approved
- [ ] Category E deletions approved
- [ ] Category F deletions approved
- [ ] Post-cleanup build successful
- [ ] Post-cleanup services running
