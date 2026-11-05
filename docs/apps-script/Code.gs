/**
 * @OnlyCurrentDoc
 *
 * Am I Being Ghosted? dataset endpoint (Google Apps Script web app).
 *
 * Setup: open the Google Sheet, Extensions > Apps Script, replace the code with this file and
 * save. Deploy > New deployment > Web app, Execute as "Me", Who has access "Anyone".
 * Copy the URL that ends in /exec into config.js on the website.
 *
 * Every check of someone's own numbers becomes one row in the "checkins" tab, unless they
 * ticked "Don't add my numbers". Rows hold numbers and menu answers only. No names, emails,
 * IDs or IP addresses reach this script. @OnlyCurrentDoc limits it to this one spreadsheet.
 */

const TAB = "checkins";
const HEADER = ["received_at", "theme", "start", "days", "applications", "interviews", "offers", "market", "field", "channel"];
const THEMES = ["ghost", "yokai"];
const MARKETS = ["de", "eu", "uk", "us", "other"];
const FIELDS = ["data", "software", "product", "business", "marketing", "engineering", "other"];
const CHANNELS = ["cold", "mix", "referral"];
const MAX_COUNT = 5000;
const ALL_PER_MINUTE = 60;
const ALL_PER_DAY = 3000;

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ ok: false, error: "bad json" });
  }
  if (!body || body.v !== 2) return reply_({ ok: false, error: "bad request" });
  const row = clean_(body);
  if (!row) return reply_({ ok: false, error: "bad values" });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return reply_({ ok: false, error: "busy" });
  try {
    const cache = CacheService.getScriptCache();
    // the very same row again within a few hours is a repeat, not a new check
    const sig = "seen:" + row.slice(1).join("|");
    if (cache.get(sig)) return reply_({ ok: true, duplicate: true });
    if (!allow_(cache, "all:" + Math.floor(Date.now() / 60000), ALL_PER_MINUTE, 120)) return reply_({ ok: false, error: "slow down" });
    if (!dailyOk_()) return reply_({ ok: false, error: "full for today" });
    sheet_().appendRow(row);
    cache.put(sig, "1", 21600);
    return reply_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

// Opening the /exec URL in a browser shows that the endpoint is alive.
function doGet() {
  return reply_({ ok: true, checkins: Math.max(0, sheet_().getLastRow() - 1) });
}

function clean_(b) {
  const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const pick = (x, list) => x === null || x === undefined ? "" : list.indexOf(x) >= 0 ? x : undefined;
  if (THEMES.indexOf(b.theme) < 0) return null;
  if (typeof b.start !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.start)) return null;
  const start = new Date(b.start + "T00:00:00Z");
  if (isNaN(start) || start.toISOString().slice(0, 10) !== b.start) return null;
  if (start < new Date("2015-01-01T00:00:00Z") || start > new Date(Date.now() + 2 * 86400000)) return null;
  if (!int(b.days, 0, 3650) || !int(b.n, 1, MAX_COUNT) || !int(b.k, 0, b.n)) return null;
  if (!int(b.o, 0, b.k)) return null;
  const market = pick(b.market, MARKETS), field = pick(b.field, FIELDS), channel = pick(b.channel, CHANNELS);
  if (market === undefined || field === undefined || channel === undefined) return null;
  return [new Date(), b.theme, b.start, b.days, b.n, b.k, b.o, market, field, channel];
}

function allow_(cache, key, max, ttl) {
  const used = Number(cache.get(key) || 0);
  if (used >= max) return false;
  cache.put(key, String(used + 1), ttl);
  return true;
}

// a cap on new rows per day, kept in script properties because the cache forgets after six hours
function dailyOk_() {
  const props = PropertiesService.getScriptProperties();
  const today = String(Math.floor(Date.now() / 86400000));
  const saved = (props.getProperty("daily") || "").split("|");
  const used = saved[0] === today ? Number(saved[1]) || 0 : 0;
  if (used >= ALL_PER_DAY) return false;
  props.setProperty("daily", today + "|" + (used + 1));
  return true;
}

function sheet_() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(TAB);
  if (!sheet) {
    sheet = book.insertSheet(TAB);
    sheet.appendRow(HEADER);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
