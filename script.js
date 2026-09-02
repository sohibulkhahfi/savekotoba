const rawData = typeof Kosakata !== "undefined" ? Kosakata : {};
let currentBab = Object.keys(rawData)[0] || "bab1";
let questions = [];
let currentIndex = 0;
let correctAnswer = "";
let score = 0;
let speak = "";

const babSelector = document.getElementById("babSelector");
const questionCard = document.getElementById("questionCard");
const choicesContainer = document.getElementById("choicesContainer");
const nextBtn = document.getElementById("nextBtn");
const progress = document.getElementById("progress");

window.onload = () => {
	Object.keys(rawData).forEach((bab) => {
		const opt = document.createElement("option");
		opt.value = bab;
		opt.textContent = bab.toUpperCase();
		babSelector.appendChild(opt);
		const quizHiraganaToggle = document.getElementById("quizHiraganaToggle");
		if (quizHiraganaToggle) {
			quizHiraganaToggle.addEventListener("change", () => {
				showQuestion(); // Perbarui tampilan soal saat checkbox diubah
			});
		}
	});

	showMenu("flashcards");
};

babSelector.addEventListener("change", () => {
	currentBab = babSelector.value;
	startGame();
});

function showMenu(menu) {
	document
		.querySelectorAll(".content > div")
		.forEach((div) => div.classList.add("hidden"));
	document.getElementById(menu).classList.remove("hidden");
	if (menu === "flashcards") loadFlashcards();
	if (menu === "game") startGame();
}

function speakSentence(text) {
	const utterance = new SpeechSynthesisUtterance(text);
	utterance.lang = "ja-JP";
	utterance.rate = 0.8;
	speechSynthesis.speak(utterance);
}

// Fungsi helper untuk mengacak array (Fisher-Yates Shuffle)
function shuffleArray(array) {
	const newArray = [...array];
	for (let i = newArray.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

function loadFlashcards() {
	const flashcardContainer = document.getElementById("flashcardContainer");
	flashcardContainer.innerHTML = "";

	if (Object.keys(rawData).length === 0) {
		flashcardContainer.textContent = "Belum ada data kosakata yang tersedia.";
		return;
	}

	Object.keys(rawData).forEach((bab) => {
		const babToggle = document.createElement("button");
		babToggle.className = "toggle-bab";
		babToggle.textContent = bab;
		flashcardContainer.appendChild(babToggle);

		const vocabContainer = document.createElement("div");
		vocabContainer.className = "vocab-container";
		vocabContainer.style.display = "none";
		flashcardContainer.appendChild(vocabContainer);

		// State untuk melacak mode dan posisi kartu pada Bab ini
		let isSingleMode = false;
		let shuffledData = [];
		let currentIndex = 0;

		// Tambahkan tombol Mode dan Back di dalam controls container
		const controlsDiv = document.createElement("div");
		controlsDiv.className = "controls-container";
		controlsDiv.style.marginBottom = "15px";
		controlsDiv.innerHTML = `
            <label style="cursor: pointer; margin-right: 15px;">
                <input type="checkbox" class="hiragana-toggle" checked> Tampilkan hiragana
            </label>
            <button class="mode-toggle" style="margin-right: 10px; cursor: pointer;">Mode: Satu per Satu</button>
            <button class="prev-btn" style="display: none; cursor: pointer;">⬅ Back</button>
        `;
		vocabContainer.appendChild(controlsDiv);

		// Container dinamis yang akan diisi oleh Grid atau Single Card
		const viewContainer = document.createElement("div");
		vocabContainer.appendChild(viewContainer);

		const checkbox = controlsDiv.querySelector(".hiragana-toggle");
		const modeToggle = controlsDiv.querySelector(".mode-toggle");
		const prevBtn = controlsDiv.querySelector(".prev-btn");

		// Fungsi Helper untuk membuat DOM kartu agar kode lebih rapi
		const createCardElement = (entry, showHira) => {
			const kanjiOrHira = entry[0] || entry[1];
			const hiragana = entry[1];
			const arti = entry[2];

			const flashcard = document.createElement("div");
			flashcard.className = "flashcard";

			const frontDiv = document.createElement("div");
			frontDiv.className = "card-front";
			const backDiv = document.createElement("div");
			backDiv.className = "card-back";

			if (entry[0] && showHira) {
				frontDiv.innerHTML = `<span class="card-sub">${hiragana}</span>${kanjiOrHira}`;
			} else {
				frontDiv.innerHTML = kanjiOrHira;
			}

			backDiv.innerHTML = `${arti}<span class="card-sub">${hiragana}</span>`;

			flashcard.appendChild(frontDiv);
			flashcard.appendChild(backDiv);

			return { flashcard, hiragana };
		};

		// Fungsi utama untuk merender tampilan berdasarkan mode saat ini
		const renderView = () => {
			viewContainer.innerHTML = "";

			if (!isSingleMode) {
				// --- TAMPILAN DEFAULT (GRID) ---
				modeToggle.textContent = "Mode: Satu per Satu (Acak)";
				prevBtn.style.display = "none";

				const cardsGrid = document.createElement("div");
				cardsGrid.style.display = "grid";
				cardsGrid.style.gridTemplateColumns =
					"repeat(auto-fill, minmax(140px, 1fr))";
				cardsGrid.style.gap = "15px";

				let lastOpenedCard = null;

				rawData[bab].forEach((entry) => {
					const { flashcard, hiragana } = createCardElement(
						entry,
						checkbox.checked,
					);

					flashcard.onclick = () => {
						const isFlipped = flashcard.classList.contains("flipped");
						if (lastOpenedCard && lastOpenedCard !== flashcard) {
							lastOpenedCard.classList.remove("flipped");
						}

						if (!isFlipped) {
							flashcard.classList.add("flipped");
							if (hiragana && typeof speakSentence === "function")
								speakSentence(hiragana);
							lastOpenedCard = flashcard;
						} else {
							flashcard.classList.remove("flipped");
							lastOpenedCard = null;
						}
					};
					cardsGrid.appendChild(flashcard);
				});
				viewContainer.appendChild(cardsGrid);
			} else {
				// --- TAMPILAN SATU PER SATU ---
				modeToggle.textContent = "Mode: Semua (Grid)";
				prevBtn.style.display = currentIndex > 0 ? "inline-block" : "none";

				const singleContainer = document.createElement("div");
				singleContainer.style.display = "flex";
				singleContainer.style.flexDirection = "column";
				singleContainer.style.alignItems = "center";
				singleContainer.style.marginTop = "20px";

				// Cek jika sudah mencapai akhir kartu
				if (currentIndex >= shuffledData.length) {
					singleContainer.innerHTML = `<h3 style="margin-bottom:15px;">Selesai! 🎉</h3>`;
					const resetBtn = document.createElement("button");
					resetBtn.textContent = "Ulangi Latihan";
					resetBtn.style.cursor = "pointer";
					resetBtn.onclick = () => {
						shuffledData = shuffleArray(rawData[bab]);
						currentIndex = 0;
						renderView();
					};
					singleContainer.appendChild(resetBtn);
					viewContainer.appendChild(singleContainer);
					return;
				}

				// Render kartu yang sedang aktif
				const entry = shuffledData[currentIndex];
				const { flashcard, hiragana } = createCardElement(
					entry,
					checkbox.checked,
				);

				// Sedikit penyesuaian gaya agar kartu tunggal lebih terfokus (opsional)
				flashcard.style.width = "250px";
				flashcard.style.height = "180px";
				flashcard.style.fontSize = "1.2em";

				flashcard.onclick = () => {
					if (flashcard.style.pointerEvents === "none") return;

					const isFlipped = flashcard.classList.contains("flipped");

					if (!isFlipped) {
						flashcard.classList.add("flipped");
						if (hiragana && typeof speakSentence === "function")
							speakSentence(hiragana);
					} else {
						// 1. Membalikkan kartu ke depan + perlahan menghilang (fade out)
						flashcard.classList.remove("flipped");
						flashcard.classList.add("hidden-card");
						flashcard.style.pointerEvents = "none";

						// 2. Tunggu transisi selesai (misal 500ms), lalu ganti data kartu
						setTimeout(() => {
							currentIndex++;
							renderView();

							// 3. Efek Fade In untuk kartu baru
							const newCard = viewContainer.querySelector(".flashcard");
							if (newCard) {
								newCard.classList.add("hidden-card");
								// Force reflow agar animasi CSS berjalan pasca render
								void newCard.offsetWidth;
								newCard.classList.remove("hidden-card");
							}
						}, 500);
					}
				};

				// Teks indikator progress (misal: 1 / 20)
				const progressText = document.createElement("p");
				progressText.textContent = `Kartu ${currentIndex + 1} dari ${shuffledData.length}`;
				progressText.style.marginTop = "15px";

				singleContainer.appendChild(flashcard);
				singleContainer.appendChild(progressText);
				viewContainer.appendChild(singleContainer);
			}
		};

		// Event Listeners untuk kontrol
		checkbox.onchange = renderView;

		modeToggle.onclick = () => {
			isSingleMode = !isSingleMode;
			if (isSingleMode) {
				// Saat masuk mode single, acak data dan mulai dari 0
				shuffledData = shuffleArray(rawData[bab]);
				currentIndex = 0;
			}
			renderView();
		};

		prevBtn.onclick = () => {
			if (currentIndex > 0) {
				currentIndex--;
				renderView(); // Merender ulang membalikkan kartu kembali ke sisi depan
			}
		};

		// Render pertama kali (saat tombol Bab diklik)
		babToggle.onclick = () => {
			document.querySelectorAll(".vocab-container").forEach((container) => {
				if (container !== vocabContainer) {
					container.style.display = "none";
				}
			});
			const isOpen = vocabContainer.style.display === "block";
			vocabContainer.style.display = isOpen ? "none" : "block";

			if (!isOpen) {
				// Pastikan selalu mulai dengan grid view saat Bab baru dibuka
				isSingleMode = false;
				renderView();
			}
		};
	});
}

function startGame() {
	if (!rawData[currentBab]) return;
	questions = shuffle([...rawData[currentBab]]);
	currentIndex = 0;
	score = 0;
	showQuestion();
}

function showQuestion() {
	if (currentIndex >= questions.length) {
		questionCard.textContent =
			"Selesai! Skor benar: " + score + " dari " + questions.length;
		choicesContainer.innerHTML = "";
		nextBtn.style.display = "none";
		return;
	}

	const q = questions[currentIndex];
	const kanji = q[0] || q[1];
	speak = q[1];
	correctAnswer = q[2];

	// --- UBAH BAGIAN INI ---
	const showHiraQuiz =
		document.getElementById("quizHiraganaToggle")?.checked ?? true;

	let cardHTML = `<span class="kanji-main">${kanji}</span>`;

	// Tampilkan hiragana di bawah kanji jika checkbox aktif dan karakter kanji berbeda dari hiragana
	if (q[0] && showHiraQuiz) {
		cardHTML += `<div class="kanji-sub">(${q[1]})</div>`;
	} else if (!q[0]) {
		// Jika soal memang hanya berupa hiragana (tidak ada kanji), tetap tampilkan
		cardHTML = `<span class="kanji-main">${q[1]}</span>`;
	}

	questionCard.innerHTML = cardHTML;
	// -----------------------

	progress.textContent = `${currentIndex + 1} / ${questions.length}`;

	const allChoices = getRandomChoices(rawData[currentBab], correctAnswer);
	choicesContainer.innerHTML = "";
	allChoices.forEach((choice) => {
		const btn = document.createElement("button");
		btn.textContent = choice;
		btn.onclick = () => handleAnswer(btn, choice);
		choicesContainer.appendChild(btn);
	});
}

function handleAnswer(button, choice) {
	const buttons = document.querySelectorAll(".choices button");
	buttons.forEach((btn) => (btn.disabled = true));
	if (choice === correctAnswer) {
		button.classList.add("correct");
		score++;
	} else {
		button.classList.add("wrong");
		buttons.forEach((btn) => {
			if (btn.textContent === correctAnswer) {
				btn.classList.add("correct");
			}
		});
	}
	nextBtn.style.display = "block";
	speakSentence(speak);
}

nextBtn.onclick = () => {
	currentIndex++;
	nextBtn.style.display = "none";
	showQuestion();
};

function getRandomChoices(data, correct) {
	const otherChoices = shuffle(data.filter((item) => item[2] !== correct))
		.slice(0, 3)
		.map((item) => item[2]);
	return shuffle([correct, ...otherChoices]);
}

function shuffle(arr) {
	return arr.sort(() => Math.random() - 0.5);
}

document.getElementById("lihatDaftarBtn").onclick = () => {
	const listElement = document.getElementById("modalList");
	const modalBabTitle = document.getElementById("modalBabTitle");
	const data = rawData[currentBab];
	listElement.innerHTML = "";
	modalBabTitle.textContent = currentBab.toUpperCase();

	data.forEach((item) => {
		const li = document.createElement("li");
		li.textContent = `${item[0] ? item[0] + " - " : ""}${item[1]} (${item[2]})`;
		listElement.appendChild(li);
	});

	document.getElementById("modal").style.display = "flex";
};
