// Import elements and options from data.js
import { elements, countOptions } from "./data.js";

const modeEl = document.getElementById("mode");
const countEl = document.getElementById("count");
const startBtn = document.getElementById("start");
const questionEl = document.getElementById("question");
const answerInput = document.getElementById("answer");
const submitBtn = document.getElementById("submit");
const skipBtn = document.getElementById("skip");
const logEl = document.getElementById("log");
const barEl = document.getElementById("bar");
const metaEl = document.getElementById("meta");
const scoreCorrectEl = document.getElementById("scoreCorrect");
const scoreWrongEl = document.getElementById("scoreWrong");
const remainingEl = document.getElementById("remaining");
const revealBtn = document.getElementById("reveal");
const restartBtn = document.getElementById("restart");

// Build Questions dropdown from countOptions
(function populateCountOptions() {
  try {
    const opts = countOptions || [10, 20, elements.length];
    // clear and add options
    countEl.innerHTML = "";
    opts.forEach((o) => {
      const option = document.createElement("option");
      option.value = String(o);
      option.textContent =
        o === "all"
          ? `All ${elements.length}`
          : String(o === elements.length ? `All ${elements.length}` : o);
      countEl.appendChild(option);
    });
    // default to 36, then 20, then first
    let defaultVal = null;
    if (opts.includes(36)) defaultVal = "36";
    else if (opts.includes(20)) defaultVal = "20";
    else defaultVal = String(opts[0]);
    countEl.value = defaultVal;
  } catch (e) {
    // ignore and keep the static options in HTML if something goes wrong
    console.warn("Failed to populate count options from CONFIG", e);
  }
})();

// update footer with element count
(function updateFooterNote() {
  const footerNote = document.querySelector("footer .small");
  if (footerNote)
    footerNote.textContent = `Quiz for first ${elements.length} elements`;
})();

let quiz = [];
let current = 0;
let correct = 0;
let wrong = 0;
let quizStartTime = null;
let questionStartTime = null;
let timerInterval = null;
let questionDurations = []; // attempt timings

function startQuiz() {
  const mode = modeEl.value;
  // Allow 'all' or numeric count
  let total = countEl.value === "all" ? elements.length : Number(countEl.value);
  if (!Number.isFinite(total) || total <= 0) total = elements.length;
  total = Math.min(total, elements.length);

  // use first N elements only
  let pool = shuffle(elements.slice(0, total));

  quiz = pool.map((e) => ({
    type:
      mode === "mixed"
        ? randomChoice(["symbol-number", "number-symbol"])
        : mode,
    ...e,
  }));

  // shuffle quiz
  quiz = shuffle(quiz);

  current = 0;
  correct = 0;
  wrong = 0;
  logEl.innerHTML = "";
  updateScores();
  questionDurations = [];
  quizStartTime = Date.now();
  startTimer();
  renderQuestion();
  answerInput.focus();
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!quizStartTime) return;
    const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    metaEl.textContent = `Time: ${mins}m ${secs}s | Question: ${current + 1}/${
      quiz.length
    }`;
  }, 1000);
}

function renderQuestion() {
  if (current >= quiz.length) {
    finishQuiz();
    return;
  }
  const q = quiz[current];
  if (q.type === "symbol-number")
    questionEl.innerHTML = `<strong>Symbol → Atomic Number</strong><div style='margin-top:6px;font-size:28px'>${q.symbol}</div>`;
  else
    questionEl.innerHTML = `<strong>Atomic Number → Symbol</strong><div style='margin-top:6px;font-size:28px'>${q.num}</div>`;
  barEl.style.width = `${(current / quiz.length) * 100}%`;
  remainingEl.textContent = quiz.length - current;
  answerInput.value = "";
  questionStartTime = Date.now();
}

function checkAnswer() {
  if (current >= quiz.length) return;
  const q = quiz[current];
  const ans = answerInput.value.trim();
  if (!ans) return;

  const timeTaken = (Date.now() - questionStartTime) / 1000;
  let correctAns =
    q.type === "symbol-number" ? String(q.num) : q.symbol.toLowerCase();
  let userAns = q.type === "symbol-number" ? ans : ans.toLowerCase();
  let isCorrect = correctAns === userAns;

  questionDurations.push({
    qText: q.type === "symbol-number" ? q.symbol : `${q.num}`,
    elementNum: q.num,
    symbol: q.symbol,
    direction:
      q.type === "symbol-number" ? "Symbol → Number" : "Number → Symbol",
    time: timeTaken,
    correct: isCorrect,
  });
  const log = document.createElement("div");
  log.className = "log-item " + (isCorrect ? "correct" : "wrong");
  log.innerHTML = `Q${current + 1}: ${
    q.type === "symbol-number" ? q.symbol : q.num
  } → <strong>${
    isCorrect ? ans : correctAns
  }</strong> <span class='small' style='float:right'>${timeTaken.toFixed(
    1
  )}s</span>`;
  if (!isCorrect)
    log.innerHTML += `<div class='small'>Your answer: ${ans}</div>`;
  logEl.prepend(log);
  if (isCorrect) correct++;
  else wrong++;
  current++;
  updateScores();
  renderQuestion();
}

function skipQuestion() {
  if (current >= quiz.length) return;
  const q = quiz[current];
  const timeTaken = (Date.now() - questionStartTime) / 1000;
  questionDurations.push({
    qText: q.type === "symbol-number" ? q.symbol : `${q.num}`,
    elementNum: q.num,
    symbol: q.symbol,
    direction:
      q.type === "symbol-number" ? "Symbol → Number" : "Number → Symbol",
    time: timeTaken,
    correct: false,
  });
  const log = document.createElement("div");
  log.className = "log-item wrong";
  log.innerHTML = `Skipped Q${current + 1}: ${
    q.type === "symbol-number" ? q.symbol : q.num
  } → ${
    q.type === "symbol-number" ? q.num : q.symbol
  } <span class='small' style='float:right'>${timeTaken.toFixed(1)}s</span>`;
  logEl.prepend(log);
  wrong++;
  current++;
  updateScores();
  renderQuestion();
}

function revealAnswer() {
  if (current >= quiz.length) return;
  const q = quiz[current];
  const ans = q.type === "symbol-number" ? q.num : q.symbol;
  const log = document.createElement("div");
  log.className = "log-item";
  log.textContent = `Answer: ${ans}`;
  logEl.prepend(log);
}

function finishQuiz() {
  clearInterval(timerInterval);
  const totalTime = (Date.now() - quizStartTime) / 1000;
  const mins = Math.floor(totalTime / 60);
  const secs = Math.floor(totalTime % 60);
  barEl.style.width = "100%";
  questionEl.innerHTML = `<h3>Finished!</h3><p>Score: ${correct}/${quiz.length}</p><p>Total Time: <strong>${mins}m ${secs}s</strong></p>`;

  // Sort by longest recall
  // Aggregate by element (use elementNum) and take the longest time per element.
  const byElement = {};
  questionDurations.forEach((d) => {
    const id = d.elementNum;
    if (!byElement[id]) {
      byElement[id] = {
        elementNum: d.elementNum,
        symbol: d.symbol,
        maxTime: d.time,
        wrong: d.correct === false ? true : false,
      };
    } else {
      if (d.time > byElement[id].maxTime) byElement[id].maxTime = d.time;
      if (d.correct === false) byElement[id].wrong = true;
    }
  });

  const aggregated = Object.values(byElement).sort(
    (a, b) => b.maxTime - a.maxTime
  );
  let resultHTML =
    "<div style='margin-top:12px;font-size:14px'><strong>Questions sorted by time taken:</strong><ul style='margin-top:6px;padding-left:16px'>";
  aggregated.forEach((e) => {
    const cross = e.wrong ? " ❌" : "";
    resultHTML += `<li>${e.symbol} (${e.elementNum}) — ${e.maxTime.toFixed(
      1
    )}s${cross}</li>`;
  });
  resultHTML += "</ul></div>";

  logEl.innerHTML = resultHTML + "<hr>" + logEl.innerHTML;
  metaEl.textContent = "Quiz complete";
}

function updateScores() {
  scoreCorrectEl.textContent = correct;
  scoreWrongEl.textContent = wrong;
  remainingEl.textContent = quiz.length - current;
}

function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomChoice(a) {
  return a[Math.floor(Math.random() * a.length)];
}

startBtn.addEventListener("click", startQuiz);
submitBtn.addEventListener("click", checkAnswer);
skipBtn.addEventListener("click", skipQuestion);
revealBtn.addEventListener("click", revealAnswer);
restartBtn.addEventListener("click", () => {
  quiz = [];
  current = 0;
  correct = 0;
  wrong = 0;
  logEl.innerHTML = "";
  updateScores();
  clearInterval(timerInterval);
  metaEl.textContent = "Mode: — | Question: — / —";
  barEl.style.width = "0%";
  questionEl.textContent = "Press Start Quiz to begin.";
});
answerInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    checkAnswer();
  }
});
