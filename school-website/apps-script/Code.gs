/** School Management API. Paste into Extensions > Apps Script of your Google Sheet.
 *  Then: Project Settings > Script properties > add API_KEY (your secret access key). */
const H = 4, F = 5; // header row, first data row
const EDIT = ['Schools','Classes','Teachers','Students','Attendance','Grades','Fees','Timetable','Staff Attendance','Payroll'];
const READ = EDIT.concat(['Email Log', 'Report Files']);
// column (1-based) that is empty when a row is free
const ANCHOR = {Schools:2, Classes:3, Teachers:2, Students:2, Attendance:2, Grades:1, Fees:1, Timetable:1, 'Staff Attendance':2, Payroll:1};

const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const authed = k => k && k === PropertiesService.getScriptProperties().getProperty('API_KEY');

function doGet(e) {
  if (!authed(e.parameter.key)) return out({error: 'Wrong access key'});
  const ss = SpreadsheetApp.getActive(), tz = ss.getSpreadsheetTimeZone(), sheets = {}, raw = {};
  const fix = v => v instanceof Date ? Utilities.formatDate(v, tz, 'yyyy-MM-dd') : v;
  READ.forEach(n => {
    const sh = ss.getSheetByName(n); if (!sh) return;
    const w = sh.getLastColumn(), head = sh.getRange(H, 1, 1, w).getValues()[0];
    const vals = sh.getRange(F, 1, sh.getLastRow() - F + 1, w).getValues();
    const fm = sh.getRange(F + 1, 1, 1, w).getFormulas()[0], rows = [];
    vals.forEach((r, i) => { if (r.some(c => c !== '')) { const o = {_r: F + i}; head.forEach((k, j) => o[k] = fix(r[j])); rows.push(o); } });
    sheets[n] = {headers: head, edit: fm.map(f => !f), rows};   // formula columns are read-only
  });
  ['Guide', 'Settings'].forEach(n => raw[n] = ss.getSheetByName(n).getDataRange().getDisplayValues());
  const st = ss.getSheetByName('Settings'), g = a => st.getRange(a).getValues();
  const col = a => g(a).map(r => r[0]).filter(String);
  const meta = {year: g('B5')[0][0], currency: g('B6')[0][0], max: g('B7')[0][0], cw: g('B8')[0][0],
    terms: col('A11:A13'), classes: col('B11:B30'), subjects: col('C11:C25'), bands: g('E11:G15')};
  return out({meta, sheets, raw});
}

function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  if (!authed(b.key)) return out({error: 'Wrong access key'});
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    (b.ops || [b]).forEach(o => apply(ss, o));
    SpreadsheetApp.flush();
    return out({ok: true});
  } catch (err) { return out({error: String(err)}); }
  finally { lock.releaseLock(); }
}

// op = {action:'add'|'update'|'delete', sheet, row, values:{Header: value}}. Never touches formula cells.
function apply(ss, o) {
  if (EDIT.indexOf(o.sheet) < 0) throw 'Sheet not editable: ' + o.sheet;
  const sh = ss.getSheetByName(o.sheet), w = sh.getLastColumn();
  const head = sh.getRange(H, 1, 1, w).getValues()[0];
  let r = o.row;
  if (o.action === 'add') {
    const c = sh.getRange(F, ANCHOR[o.sheet], sh.getLastRow() - F + 1, 1).getValues();
    const i = c.findIndex(x => x[0] === ''); if (i < 0) throw o.sheet + ' is full';
    r = F + i;
  }
  const fm = sh.getRange(r, 1, 1, w).getFormulas()[0];
  head.forEach((k, j) => {
    if (fm[j]) return;
    const cell = sh.getRange(r, j + 1);
    if (o.action === 'delete') cell.clearContent();
    else if (o.values && k in o.values) cell.setValue(o.values[k]);
  });
}
