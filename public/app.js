const DB_NAME = "caderno-pessoal-db";
const STORE = "transactions";
const SETTINGS = "settings";
const DB_VERSION = 1;

const state = {
  db: null,
  transactions: [],
  importPreview: [],
};

const $ = (id) => document.getElementById(id);
const todayISO = () => new Date().toISOString().slice(0, 10);
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("date", "date");
        store.createIndex("externalId", "externalId", { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(storeName, mode = "readonly") {
  return state.db.transaction(storeName, mode).objectStore(storeName);
}

function getAll(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function put(storeName, value) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").put(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteRecord(id) {
  return new Promise((resolve, reject) => {
    const request = tx(STORE, "readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const request = tx(storeName, "readwrite").clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function formatCurrency(value) {
  return money.format(Number(value || 0));
}

function parseAmount(input) {
  const cleaned = String(input || "")
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Valor invalido.");
  }
  return Math.round(value * 100) / 100;
}

function normalizeDate(value) {
  if (!value) return todayISO();
  const trimmed = String(value).trim();
  const br = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return todayISO();
}

function monthKey(date) {
  return date.slice(0, 7);
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function navigate(screen) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  $(`screen-${screen}`).classList.add("active");
  if (screen === "reports") renderReports();
  if (screen === "home") renderHome();
}

async function loadTransactions() {
  state.transactions = await getAll(STORE);
  state.transactions.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
}

function renderTransactionList(container, items, options = {}) {
  container.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = options.empty || "Nenhum lancamento encontrado.";
    container.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("article");
    row.className = "transaction-item";
    const signed = item.type === "income" ? item.amount : -item.amount;
    row.innerHTML = `
      <div>
        <span class="transaction-title"></span>
        <span class="transaction-meta">${item.date.split("-").reverse().join("/")} · ${item.source || "manual"}</span>
      </div>
      <div>
        <div class="transaction-value ${item.type}">${formatCurrency(signed)}</div>
        ${options.deletable ? '<button class="delete-button" type="button" aria-label="Excluir">Excluir</button>' : ""}
      </div>
    `;
    row.querySelector(".transaction-title").textContent = item.description;
    if (options.deletable) {
      row.querySelector(".delete-button").addEventListener("click", async () => {
        if (!confirm("Excluir este lancamento?")) return;
        await deleteRecord(item.id);
        await loadTransactions();
        renderHome();
        showToast("Lancamento excluido.");
      });
    }
    container.appendChild(row);
  });
}

function renderHome() {
  const selected = $("selectedDate").value || todayISO();
  const selectedMonth = monthKey(selected);
  const monthItems = state.transactions.filter((item) => monthKey(item.date) === selectedMonth);
  const income = monthItems.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expense = monthItems.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const dayItems = state.transactions.filter((item) => item.date === selected);
  const dayTotal = dayItems.reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0);

  $("monthIncome").textContent = formatCurrency(income);
  $("monthExpense").textContent = formatCurrency(expense);
  $("monthBalance").textContent = formatCurrency(income - expense);
  $("dayTotal").textContent = formatCurrency(dayTotal);
  renderTransactionList($("dayTransactions"), dayItems, { deletable: true, empty: "Nada registrado nesta data." });
}

async function saveTransaction(data) {
  const record = {
    id: data.id || crypto.randomUUID(),
    description: data.description.trim(),
    amount: Number(data.amount),
    type: data.type,
    date: normalizeDate(data.date),
    source: data.source || "manual",
    externalId: data.externalId || "",
    createdAt: data.createdAt || new Date().toISOString(),
  };
  await put(STORE, record);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const separator = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(separator).map((h) => h.trim().toLowerCase());
  const dataLines = headers.some((h) => /data|date|valor|amount|descricao|historico/.test(h)) ? lines.slice(1) : lines;

  return dataLines.map((line, index) => {
    const cols = line.split(separator).map((c) => c.trim().replace(/^"|"$/g, ""));
    const byHeader = (names, fallbackIndex) => {
      const found = names.map((name) => headers.indexOf(name)).find((i) => i >= 0);
      return cols[found >= 0 ? found : fallbackIndex] || "";
    };
    const date = normalizeDate(byHeader(["data", "date"], 0));
    const description = byHeader(["descricao", "descrição", "historico", "histórico", "memo", "texto"], 1) || `Importado ${index + 1}`;
    const rawValue = byHeader(["valor", "amount", "quantia"], 2);
    const signed = Number(String(rawValue).replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
    const amount = Math.abs(signed);
    if (!amount) return null;
    return {
      id: crypto.randomUUID(),
      description,
      amount,
      type: signed >= 0 ? "income" : "expense",
      date,
      source: "import",
      externalId: `csv:${date}:${description}:${signed}`,
      createdAt: new Date().toISOString(),
    };
  }).filter(Boolean);
}

function parseOFX(text) {
  const blocks = text.split(/<STMTTRN>/i).slice(1);
  return blocks.map((block) => {
    const get = (tag) => {
      const match = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
      return match ? match[1].trim() : "";
    };
    const rawAmount = Number(get("TRNAMT").replace(",", "."));
    const amount = Math.abs(rawAmount);
    if (!amount) return null;
    const date = normalizeDate(get("DTPOSTED").slice(0, 8).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3"));
    const description = get("MEMO") || get("NAME") || "Lancamento importado";
    const fitid = get("FITID");
    return {
      id: crypto.randomUUID(),
      description,
      amount,
      type: rawAmount >= 0 ? "income" : "expense",
      date,
      source: "import",
      externalId: fitid || `ofx:${date}:${description}:${rawAmount}`,
      createdAt: new Date().toISOString(),
    };
  }).filter(Boolean);
}

function renderImportPreview() {
  $("importCount").textContent = `${state.importPreview.length} itens`;
  $("confirmImport").disabled = state.importPreview.length === 0;
  renderTransactionList($("importPreview"), state.importPreview, { empty: "Escolha um arquivo para ver a previa." });
}

function reportRange() {
  const mode = document.querySelector("input[name='reportMode']:checked").value;
  const selected = $("selectedDate").value || todayISO();
  if (mode === "day") return { start: selected, end: selected };
  if (mode === "month") {
    const first = `${monthKey(selected)}-01`;
    const last = new Date(Number(selected.slice(0, 4)), Number(selected.slice(5, 7)), 0).toISOString().slice(0, 10);
    return { start: first, end: last };
  }
  return { start: $("reportStart").value || selected, end: $("reportEnd").value || selected };
}

function currentReportItems() {
  const { start, end } = reportRange();
  return state.transactions
    .filter((item) => item.date >= start && item.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
}

function renderReports() {
  const items = currentReportItems();
  const total = items.reduce((sum, item) => sum + (item.type === "income" ? item.amount : -item.amount), 0);
  $("reportSummary").textContent = formatCurrency(total);
  renderTransactionList($("reportList"), items, { empty: "Nenhum item neste periodo." });
}

function reportText() {
  const { start, end } = reportRange();
  const lines = [`Relatorio ${start.split("-").reverse().join("/")} ate ${end.split("-").reverse().join("/")}`, ""];
  currentReportItems().forEach((item) => {
    const signed = item.type === "income" ? item.amount : -item.amount;
    lines.push(`${item.date.split("-").reverse().join("/")} - ${item.description} - ${formatCurrency(signed)}`);
  });
  lines.push("", `Total: ${$("reportSummary").textContent}`);
  return lines.join("\n");
}

async function digestPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function exportBackup() {
  const payload = JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: state.transactions,
  });
  const password = $("backupPassword").value;
  let content;
  let filename = `caderno-backup-${todayISO()}.json`;

  if (password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await digestPassword(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(payload));
    content = JSON.stringify({
      encrypted: true,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      data: bytesToBase64(encrypted),
    });
    filename = `caderno-backup-${todayISO()}.caderno`;
  } else {
    content = payload;
  }

  downloadFile(filename, content, "application/json");
  localStorage.setItem("lastBackupAt", new Date().toISOString());
  updateBackupStatus();
  showToast("Backup exportado.");
}

async function importBackup(file) {
  const raw = await file.text();
  let parsed = JSON.parse(raw);
  if (parsed.encrypted) {
    const password = $("backupPassword").value;
    if (!password) throw new Error("Digite a senha do backup.");
    const key = await digestPassword(password, base64ToBytes(parsed.salt));
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(parsed.iv) }, key, base64ToBytes(parsed.data));
    parsed = JSON.parse(new TextDecoder().decode(decrypted));
  }
  if (!Array.isArray(parsed.transactions)) throw new Error("Backup invalido.");
  if (!confirm("Restaurar backup vai substituir os lancamentos atuais. Continuar?")) return;
  await clearStore(STORE);
  for (const item of parsed.transactions) await saveTransaction(item);
  await loadTransactions();
  renderHome();
  showToast("Backup restaurado.");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const key = await digestPassword(password, salt);
  const test = await crypto.subtle.encrypt({ name: "AES-GCM", iv: new Uint8Array(12) }, key, new TextEncoder().encode("ok"));
  return { salt: bytesToBase64(salt), verifier: bytesToBase64(test) };
}

async function validatePassword(password, setting) {
  try {
    const key = await digestPassword(password, base64ToBytes(setting.salt));
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(12) }, key, base64ToBytes(setting.verifier));
    return true;
  } catch {
    return false;
  }
}

async function getSetting(key) {
  const values = await getAll(SETTINGS);
  return values.find((item) => item.key === key)?.value;
}

async function initLock() {
  const password = await getSetting("password");
  if (password) $("lockScreen").classList.add("active");
}

async function setupPassword() {
  const password = $("appPassword").value.trim();
  if (password.length < 4) {
    showToast("Use pelo menos 4 caracteres.");
    return;
  }
  await put(SETTINGS, { key: "password", value: await hashPassword(password) });
  $("lockScreen").classList.remove("active");
  $("appPassword").value = "";
  showToast("Senha definida.");
}

async function unlock() {
  const setting = await getSetting("password");
  if (!setting) return setupPassword();
  const ok = await validatePassword($("appPassword").value, setting);
  if (!ok) {
    showToast("Senha incorreta.");
    return;
  }
  $("lockScreen").classList.remove("active");
  $("appPassword").value = "";
}

function updateBackupStatus() {
  const last = localStorage.getItem("lastBackupAt");
  $("backupStatus").textContent = last
    ? `Ultimo backup neste aparelho: ${new Date(last).toLocaleString("pt-BR")}`
    : "Nenhum backup feito neste aparelho.";
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });

  $("selectedDate").addEventListener("change", () => {
    $("entryDate").value = $("selectedDate").value;
    renderHome();
    renderReports();
  });

  $("previousDay").addEventListener("click", () => shiftDay(-1));
  $("nextDay").addEventListener("click", () => shiftDay(1));

  $("entryForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveTransaction({
        description: form.get("description"),
        amount: parseAmount(form.get("amount")),
        type: form.get("type"),
        date: form.get("date"),
      });
      event.currentTarget.reset();
      document.querySelector("input[name='type'][value='expense']").checked = true;
      $("entryDate").value = $("selectedDate").value;
      await loadTransactions();
      navigate("home");
      showToast("Lancamento salvo.");
    } catch (error) {
      showToast(error.message);
    }
  });

  $("bankFile").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    state.importPreview = file.name.toLowerCase().endsWith(".ofx") ? parseOFX(text) : parseCSV(text);
    const existing = new Set(state.transactions.map((item) => item.externalId).filter(Boolean));
    state.importPreview = state.importPreview.filter((item) => !existing.has(item.externalId));
    renderImportPreview();
  });

  $("clearImport").addEventListener("click", () => {
    $("bankFile").value = "";
    state.importPreview = [];
    renderImportPreview();
  });

  $("confirmImport").addEventListener("click", async () => {
    for (const item of state.importPreview) await saveTransaction(item);
    await loadTransactions();
    state.importPreview = [];
    renderImportPreview();
    renderHome();
    showToast("Importacao concluida.");
  });

  document.querySelectorAll("input[name='reportMode']").forEach((radio) => {
    radio.addEventListener("change", renderReports);
  });
  $("reportStart").addEventListener("change", renderReports);
  $("reportEnd").addEventListener("change", renderReports);
  $("printReport").addEventListener("click", () => window.print());
  $("shareReport").addEventListener("click", async () => {
    const text = reportText();
    if (navigator.share) {
      await navigator.share({ title: "Relatorio", text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast("Relatorio copiado.");
    }
  });

  $("exportBackup").addEventListener("click", exportBackup);
  $("restoreBackup").addEventListener("change", async (event) => {
    try {
      if (event.target.files[0]) await importBackup(event.target.files[0]);
    } catch (error) {
      showToast(error.message || "Nao foi possivel restaurar.");
    } finally {
      event.target.value = "";
    }
  });

  $("lockButton").addEventListener("click", () => $("lockScreen").classList.add("active"));
  $("unlockButton").addEventListener("click", unlock);
  $("setupPasswordButton").addEventListener("click", setupPassword);
  $("appPassword").addEventListener("keydown", (event) => {
    if (event.key === "Enter") unlock();
  });
}

function shiftDay(delta) {
  const date = new Date(`${$("selectedDate").value || todayISO()}T12:00:00`);
  date.setDate(date.getDate() + delta);
  $("selectedDate").value = date.toISOString().slice(0, 10);
  $("entryDate").value = $("selectedDate").value;
  renderHome();
}

async function init() {
  state.db = await openDb();
  $("selectedDate").value = todayISO();
  $("entryDate").value = todayISO();
  $("reportStart").value = todayISO();
  $("reportEnd").value = todayISO();
  bindEvents();
  updateBackupStatus();
  await loadTransactions();
  renderHome();
  renderImportPreview();
  await initLock();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}

init().catch((error) => {
  console.error(error);
  showToast("Erro ao abrir o caderno.");
});
