const RULES_KEY = 'rules_v1';
const PREFS_KEY = 'prefs_v1';

function $(id) {
  return document.getElementById(id);
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

async function getStored() {
  const res = await chrome.storage.local.get([RULES_KEY, PREFS_KEY]);
  const rules = res[RULES_KEY] || { autoStart: [], keywordRules: [] };
  const prefs = res[PREFS_KEY] || { notificationsEnabled: true };
  return { rules, prefs };
}

async function saveStored(rules, prefs) {
  await chrome.storage.local.set({ [RULES_KEY]: rules, [PREFS_KEY]: prefs });
  await chrome.runtime.sendMessage({ action: 'SET_RULES', rules }).catch(() => {});
  await chrome.runtime.sendMessage({ action: 'SET_PREFS', prefs }).catch(() => {});
}

function readRowAutostart(rowEl) {
  return {
    id: rowEl.dataset.id,
    urlContains: rowEl.querySelector('.urlContains').value.trim(),
    mode: rowEl.querySelector('.mode').value,
    intervalSeconds: Number.parseInt(rowEl.querySelector('.intervalSeconds').value, 10) || 30,
    randomMin: Number.parseInt(rowEl.querySelector('.randomMin').value, 10) || 5,
    randomMax: Number.parseInt(rowEl.querySelector('.randomMax').value, 10) || 30,
    maxRefreshes: Number.parseInt(rowEl.querySelector('.maxRefreshes').value, 10) || 0,
    hardRefresh: rowEl.querySelector('.hardRefresh').checked,
    stopOnInteraction: rowEl.querySelector('.stopOnInteraction').checked
  };
}

function readRowKeyword(rowEl) {
  return {
    id: rowEl.dataset.id,
    urlContains: rowEl.querySelector('.urlContains').value.trim(),
    keyword: rowEl.querySelector('.keyword').value.trim(),
    searchIn: rowEl.querySelector('.searchIn').value,
    intervalSeconds: Number.parseInt(rowEl.querySelector('.intervalSeconds').value, 10) || 30,
    hardRefresh: rowEl.querySelector('.hardRefresh').checked,
    stopOnInteraction: rowEl.querySelector('.stopOnInteraction').checked
  };
}

function addAutostartRow(rule) {
  const tpl = $('autostart-row-tpl');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = rule.id;
  node.querySelector('.urlContains').value = rule.urlContains || '';
  node.querySelector('.mode').value = rule.mode || 'interval';
  node.querySelector('.intervalSeconds').value = rule.intervalSeconds ?? 30;
  node.querySelector('.randomMin').value = rule.randomMin ?? 5;
  node.querySelector('.randomMax').value = rule.randomMax ?? 30;
  node.querySelector('.maxRefreshes').value = rule.maxRefreshes ?? 0;
  node.querySelector('.hardRefresh').checked = !!rule.hardRefresh;
  node.querySelector('.stopOnInteraction').checked = !!rule.stopOnInteraction;
  node.querySelector('.remove').addEventListener('click', () => node.remove());
  $('autostart-list').appendChild(node);
}

function addKeywordRow(rule) {
  const tpl = $('keyword-row-tpl');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = rule.id;
  node.querySelector('.urlContains').value = rule.urlContains || '';
  node.querySelector('.keyword').value = rule.keyword || '';
  node.querySelector('.searchIn').value = rule.searchIn || 'visual';
  node.querySelector('.intervalSeconds').value = rule.intervalSeconds ?? 30;
  node.querySelector('.hardRefresh').checked = !!rule.hardRefresh;
  node.querySelector('.stopOnInteraction').checked = !!rule.stopOnInteraction;
  node.querySelector('.remove').addEventListener('click', () => node.remove());
  $('keyword-list').appendChild(node);
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.hidden = true), 1600);
}

async function init() {
  const { rules, prefs } = await getStored();

  $('toggle-notifs').checked = prefs.notificationsEnabled !== false;

  (rules.autoStart || []).forEach(addAutostartRow);
  (rules.keywordRules || []).forEach(addKeywordRow);

  $('autostart-add').addEventListener('click', () => {
    addAutostartRow({
      id: uid('as'),
      urlContains: '',
      mode: 'interval',
      intervalSeconds: 30,
      randomMin: 5,
      randomMax: 30,
      maxRefreshes: 0,
      hardRefresh: false,
      stopOnInteraction: false
    });
  });

  $('keyword-add').addEventListener('click', () => {
    addKeywordRow({
      id: uid('kw'),
      urlContains: '',
      keyword: '',
      searchIn: 'visual',
      intervalSeconds: 30,
      hardRefresh: false,
      stopOnInteraction: false
    });
  });

  $('btn-save').addEventListener('click', async () => {
    const autoStart = Array.from($('autostart-list').children).map(readRowAutostart).filter((r) => r.urlContains);
    const keywordRules = Array.from($('keyword-list').children).map(readRowKeyword).filter((r) => r.urlContains && r.keyword);
    const newRules = { autoStart, keywordRules };
    const newPrefs = { notificationsEnabled: $('toggle-notifs').checked };
    await saveStored(newRules, newPrefs);
    toast('Saved');
  });
}

document.addEventListener('DOMContentLoaded', init);

