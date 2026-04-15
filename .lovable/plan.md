

## Plan: Remove Location Preferences from Settings

**What changes**: Remove the "Location Preferences" settings item from the Settings page.

### Technical Details

**File: `src/pages/Settings.tsx`**
- Remove lines 360-365 (the `SettingsItem` for `locationPreferences`)
- Remove the `MapPin` icon import if it's no longer used elsewhere in the file

**File: `src/hooks/useLanguage.tsx`**
- Translation keys `locationPreferences` and `locationPreferencesDesc` can optionally be removed (low priority, won't cause errors if left)

