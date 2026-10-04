# School Management website

A static website (works on GitHub Pages) that uses your Google Sheet as its database.
Every sheet of `School_Management_v11.xlsx` is a tab: Dashboard, Guide, Report Card, Results, Class List,
Class Attendance, Class Grades, ID Cards, Timetable View, Schools, Classes, Teachers, Students, Attendance,
Grades, Fees, Timetable, Staff Attendance, Payroll, Settings, Email Log, Report Files.

```
index.html  style.css  app.js  config.js      <- the website
apps-script/Code.gs                           <- the bridge to your Google Sheet
data/seed.json                                <- demo data (used when config.js has no URL)
tools/make_seed.py                            <- rebuilds seed.json from the xlsx
spreadsheet/School_Management_v11.xlsx        <- your original file
```

## Try it first (demo mode)
Leave `API_URL` empty in `config.js`. Run `python -m http.server` in this folder and open http://localhost:8000
(or push to GitHub, step 3). Edits are saved only in your browser.

## 1. Put the spreadsheet in Google Sheets
1. Upload `spreadsheet/School_Management_v11.xlsx` to Google Drive.
2. Open it with Google Sheets, then **File > Save as Google Sheets**.
   (If you already have the Google Sheet version with the School System menu, use that one instead.)

## 2. Connect it (Apps Script)
1. In the Sheet: **Extensions > Apps Script**. Paste all of `apps-script/Code.gs` (add it as a new file if you already have scripts; you must not already have `doGet` or `doPost`).
2. **Project Settings (gear) > Script properties > Add property**: name `API_KEY`, value = a long secret password you invent.
3. **Deploy > New deployment > type: Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, approve the permissions, copy the **Web app URL** (ends in `/exec`).
4. Paste the URL into `config.js`:
   ```js
   API_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
   ```
If you change `Code.gs` later: **Deploy > Manage deployments > Edit > New version**.

## 3. Publish on GitHub
1. Create a repository and upload everything in this folder (drag and drop works on github.com).
2. **Settings > Pages > Deploy from a branch > main / (root)**. Your site appears at `https://YOUR-NAME.github.io/REPO/`.
3. Open it and sign in with your `API_KEY`. The key is typed in the browser and never stored in GitHub.

## How it behaves
- Reads the whole workbook on load (⟳ reloads). Add, edit and clear work on the 10 record sheets; the grey columns are your formulas and are never overwritten, so IDs, balances, grades and net pay stay calculated by the Sheet.
- "Clear" blanks the input cells of a row (rows are never deleted, as your Guide asks).
- Class Attendance and Class Grades save many rows at once. Settings, Guide, Email Log and Report Files are read-only here.
- Emails, PDF report cards and the Sheet menu buttons still run from the Sheet's own script.

## Security note
The access key is a simple password. Anyone who has it can read and change the data, so use a long one and share it only with staff. For stricter control, use Google sign-in with a proper backend.
