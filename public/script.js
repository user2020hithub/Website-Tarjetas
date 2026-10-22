// Lógica del quiz de Tarjetas ES (se ejecuta en el navegador).

const QUESTIONS_PER_QUIZ = 10;
const OPTIONS_PER_QUESTION = 4;
const BEST_SCORE_KEY = "tarjetas-es-best-score";

// --- Elementos de la página ---
const screens = {
  start: document.getElementById("screen-start"),
  quiz: document.getElementById("screen-quiz"),
  result: document.getElementById("screen-result"),
};
const bestScoreEl = document.getElementById("best-score");
const startErrorEl = document.getElementById("start-error");
const progressBar = document.getElementById("progress-bar");
const qNumberEl = document.getElementById("q-number");
const qTotalEl = document.getElementById("q-total");
const qCategoryEl = document.getElementById("q-category");
const qWordEl = document.getElementById("q-word");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");
const nextBtn = document.getElementById("btn-next");
const finalScoreEl = document.getElementById("final-score");
const finalTotalEl = document.getElementById("final-total");
const resultMessageEl = document.getElementById("result-message");
const resultEmojiEl = document.getElementById("result-emoji");
const resultBestEl = document.getElementById("result-best");

// --- Estado del quiz ---
let allWords = [];
let questions = [];
let currentIndex = 0;
let score = 0;

// Muestra una pantalla y oculta las demás.
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove("active"));
  screens[name].classList.add("active");
}

// Mezcla una lista al azar (algoritmo Fisher-Yates) sin modificar la original.
function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- Mejor puntaje (localStorage) ---
// Se usa try/catch porque algunos navegadores bloquean localStorage.
function getBestScore() {
  try {
    const value = localStorage.getItem(BEST_SCORE_KEY);
    return value === null ? null : Number(value);
  } catch (e) {
    return null;
  }
}

function saveBestScore(newScore) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(newScore));
  } catch (e) {
    // Si no se puede guardar, la app sigue funcionando.
  }
}

function showBestScore() {
  const best = getBestScore();
  const text = best === null ? "–" : `${best} / ${QUESTIONS_PER_QUIZ}`;
  bestScoreEl.textContent = text;
  resultBestEl.textContent = text;
}

// --- Preparar las preguntas ---
// Para cada palabra se crean 4 opciones: la correcta y 3 incorrectas.
function buildQuestions() {
  const chosen = shuffle(allWords).slice(0, QUESTIONS_PER_QUIZ);

  return chosen.map((word) => {
    const wrongOptions = shuffle(allWords.filter((w) => w.en !== word.en))
      .slice(0, OPTIONS_PER_QUESTION - 1)
      .map((w) => w.en);

    return {
      es: word.es,
      category: word.category,
      answer: word.en,
      options: shuffle([word.en, ...wrongOptions]),
    };
  });
}

// --- Mostrar una pregunta ---
function showQuestion() {
  const q = questions[currentIndex];

  qNumberEl.textContent = currentIndex + 1;
  qTotalEl.textContent = questions.length;
  qCategoryEl.textContent = q.category;
  qWordEl.textContent = q.es;
  progressBar.style.width = `${(currentIndex / questions.length) * 100}%`;

  feedbackEl.textContent = "";
  feedbackEl.className = "feedback";
  nextBtn.hidden = true;
  nextBtn.textContent =
    currentIndex === questions.length - 1 ? "See results" : "Next";

  optionsEl.innerHTML = "";
  q.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option;
    button.addEventListener("click", () => handleAnswer(button, option));
    optionsEl.appendChild(button);
  });
}

// --- Revisar la respuesta elegida ---
function handleAnswer(clickedButton, chosen) {
  const q = questions[currentIndex];
  const isCorrect = chosen === q.answer;

  // Bloquea todos los botones y marca la respuesta correcta.
  Array.from(optionsEl.children).forEach((btn) => {
    btn.disabled = true;
    if (btn.textContent === q.answer) btn.classList.add("correct");
  });

  if (isCorrect) {
    score++;
    feedbackEl.textContent = "✅ Correct! ¡Muy bien!";
    feedbackEl.className = "feedback good";
  } else {
    clickedButton.classList.add("wrong");
    feedbackEl.textContent = `❌ Not quite. The answer is "${q.answer}".`;
    feedbackEl.className = "feedback bad";
  }

  nextBtn.hidden = false;
  nextBtn.focus();
}

// --- Pantalla de resultados ---
function showResults() {
  progressBar.style.width = "100%";

  const best = getBestScore();
  if (best === null || score > best) saveBestScore(score);
  showBestScore();

  finalScoreEl.textContent = score;
  finalTotalEl.textContent = questions.length;

  const ratio = score / questions.length;
  if (ratio === 1) {
    resultEmojiEl.textContent = "🏆";
    resultMessageEl.textContent = "Perfect score! ¡Perfecto!";
  } else if (ratio >= 0.7) {
    resultEmojiEl.textContent = "🎉";
    resultMessageEl.textContent = "Great job! Keep practicing.";
  } else if (ratio >= 0.4) {
    resultEmojiEl.textContent = "👍";
    resultMessageEl.textContent = "Good start! Try again to improve.";
  } else {
    resultEmojiEl.textContent = "💪";
    resultMessageEl.textContent = "Keep going, practice makes perfect!";
  }

  showScreen("result");
}

// --- Avanzar a la siguiente pregunta ---
nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
});

// --- Empezar (o repetir) el quiz ---
async function startQuiz() {
  startErrorEl.hidden = true;

  // Pide las palabras al servidor la primera vez.
  if (allWords.length === 0) {
    try {
      const response = await fetch("/api/words");
      if (!response.ok) throw new Error("Bad response");
      allWords = await response.json();
    } catch (e) {
      showScreen("start");
      startErrorEl.textContent =
        "Could not load the words. Please try again.";
      startErrorEl.hidden = false;
      return;
    }
  }

  questions = buildQuestions();
  currentIndex = 0;
  score = 0;
  showScreen("quiz");
  showQuestion();
}

document.getElementById("btn-start").addEventListener("click", startQuiz);
document.getElementById("btn-restart").addEventListener("click", startQuiz);

// Al cargar la página, muestra el mejor puntaje guardado.
showBestScore();
