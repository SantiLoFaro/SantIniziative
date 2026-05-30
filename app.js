const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const startBtn = document.querySelector("#startBtn");
const stopBtn = document.querySelector("#stopBtn");
const clearBtn = document.querySelector("#clearBtn");
const addManualBtn = document.querySelector("#addManualBtn");
const manualName = document.querySelector("#manualName");
const manualScore = document.querySelector("#manualScore");
const transcript = document.querySelector("#transcript");
const statusBox = document.querySelector("#status");
const initiativeList = document.querySelector("#initiativeList");
const emptyTemplate = document.querySelector("#emptyTemplate");
const countBadge = document.querySelector("#countBadge");

let recognition;
let entries = [];
let seenKeys = new Set();

const numberWords = new Map([
  ["zero", 0],
  ["uno", 1],
  ["un", 1],
  ["una", 1],
  ["due", 2],
  ["tre", 3],
  ["quattro", 4],
  ["cinque", 5],
  ["sei", 6],
  ["sette", 7],
  ["otto", 8],
  ["nove", 9],
  ["dieci", 10],
  ["undici", 11],
  ["dodici", 12],
  ["tredici", 13],
  ["quattordici", 14],
  ["quindici", 15],
  ["sedici", 16],
  ["diciassette", 17],
  ["diciotto", 18],
  ["diciannove", 19],
  ["venti", 20],
  ["ventuno", 21],
  ["ventidue", 22],
  ["ventitre", 23],
  ["ventiquattro", 24],
  ["venticinque", 25],
  ["ventisei", 26],
  ["ventisette", 27],
  ["ventotto", 28],
  ["ventinove", 29],
  ["trenta", 30],
  ["trentuno", 31],
  ["trentadue", 32],
  ["trentatre", 33],
  ["trentaquattro", 34],
  ["trentacinque", 35],
  ["trentasei", 36],
  ["trentasette", 37],
  ["trentotto", 38],
  ["trentanove", 39],
  ["quaranta", 40],
  ["cinquanta", 50],
  ["sessanta", 60],
  ["settanta", 70],
  ["ottanta", 80],
  ["novanta", 90],
  ["cento", 100],
]);

const unitWords = new Set(["uno", "un", "una", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"]);

function setStatus(message, listening = false) {
  statusBox.textContent = message;
  statusBox.classList.toggle("listening", listening);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([\p{L}])(\d)/gu, "$1 $2")
    .replace(/(\d)([\p{L}])/gu, "$1 $2")
    .replace(/[;:]/g, ",")
    .replace(/\be\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(value) {
  const cleaned = value.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");
  if (/^-?\d+$/.test(cleaned)) return Number(cleaned);
  return numberWords.get(cleaned);
}

function parseEntries(text) {
  const tokens = normalizeText(text)
    .split(/[\s,.\n]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const found = [];
  let nameParts = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    let score = parseNumber(token);
    const nextScore = parseNumber(tokens[index + 1] ?? "");

    if (score >= 20 && score < 100 && score % 10 === 0 && unitWords.has(tokens[index + 1])) {
      score += nextScore;
      index += 1;
    }

    if (Number.isFinite(score) && nameParts.length) {
      found.push({
        name: titleCaseName(nameParts.join(" ")),
        score,
      });
      nameParts = [];
      continue;
    }

    if (!Number.isFinite(score)) {
      nameParts.push(token);
    }
  }

  return found;
}

function titleCaseName(value) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function addEntries(newEntries) {
  let added = 0;

  for (const item of newEntries) {
    const key = `${item.name.toLowerCase()}-${item.score}`;
    if (seenKeys.has(key)) continue;

    seenKeys.add(key);
    entries.push(item);
    added += 1;
  }

  if (added) {
    sortEntries();
    renderEntries();
    setStatus(`${added} elemento${added === 1 ? "" : "i"} aggiunt${added === 1 ? "o" : "i"}.`, false);
  }
}

function sortEntries() {
  entries.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, "it"));
}

function renderEntries() {
  initiativeList.innerHTML = "";
  countBadge.textContent = String(entries.length);

  if (!entries.length) {
    initiativeList.append(emptyTemplate.content.cloneNode(true));
    return;
  }

  entries.forEach((entry, index) => {
    const li = document.createElement("li");
    li.className = "initiative-item";
    li.innerHTML = `
      <span class="rank">${index + 1}</span>
      <span class="name"></span>
      <span class="score">${entry.score}</span>
    `;
    li.querySelector(".name").textContent = entry.name;
    initiativeList.append(li);
  });
}

function stopAndSort() {
  if (recognition) recognition.stop();
  sortEntries();
  renderEntries();
  startBtn.disabled = false;
  stopBtn.disabled = true;
  setStatus(entries.length ? "Ordine iniziativa aggiornato." : "Nessuna coppia riconosciuta.", false);
}

function setupSpeechRecognition() {
  if (!SpeechRecognition) {
    startBtn.disabled = true;
    setStatus("Riconoscimento vocale non disponibile in questo browser. Puoi usare l'inserimento manuale.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "it-IT";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    setStatus("Sto ascoltando...", true);
  };

  recognition.onresult = (event) => {
    let interim = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const phrase = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        transcript.value = `${transcript.value} ${phrase}`.trim();
        addEntries(parseEntries(phrase));
      } else {
        interim += phrase;
      }
    }

    if (interim) setStatus(`Capito finora: ${interim}`, true);
  };

  recognition.onerror = (event) => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus(`Microfono non attivo: ${event.error}. Puoi riprovare o inserire a mano.`);
  };

  recognition.onend = () => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusBox.classList.remove("listening");
  };
}

startBtn.addEventListener("click", () => {
  if (!recognition) return;
  recognition.start();
});

stopBtn.addEventListener("click", stopAndSort);

clearBtn.addEventListener("click", () => {
  entries = [];
  seenKeys = new Set();
  transcript.value = "";
  manualName.value = "";
  manualScore.value = "";
  renderEntries();
  setStatus("Lista pulita. Pronto per un nuovo combattimento.");
});

addManualBtn.addEventListener("click", () => {
  const name = titleCaseName(manualName.value.trim());
  const score = Number(manualScore.value);

  if (!name || !Number.isFinite(score)) {
    setStatus("Inserisci sia il nome sia un numero valido.");
    return;
  }

  addEntries([{ name, score }]);
  manualName.value = "";
  manualScore.value = "";
  manualName.focus();
});

transcript.addEventListener("change", () => {
  addEntries(parseEntries(transcript.value));
});

setupSpeechRecognition();
renderEntries();
