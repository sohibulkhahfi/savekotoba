        const rawData = typeof Kosakata !== 'undefined' ? Kosakata : {};
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
            Object.keys(rawData).forEach(bab => {
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

            showMenu('flashcards');
        };

        babSelector.addEventListener("change", () => {
            currentBab = babSelector.value;
            startGame();
        });

        function showMenu(menu) {
            document.querySelectorAll('.content > div').forEach(div => div.classList.add('hidden'));
            document.getElementById(menu).classList.remove('hidden');
            if (menu === 'flashcards') loadFlashcards();
            if (menu === 'game') startGame();
        }

        function speakSentence(text) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ja-JP";
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
        }

        function loadFlashcards() {
            const flashcardContainer = document.getElementById('flashcardContainer');
            flashcardContainer.innerHTML = '';

            if (Object.keys(rawData).length === 0) {
                flashcardContainer.textContent = 'Belum ada data kosakata yang tersedia.';
                return;
            }

            Object.keys(rawData).forEach(bab => {
                const babToggle = document.createElement('button');
                babToggle.className = 'toggle-bab';
                babToggle.textContent = bab;
                flashcardContainer.appendChild(babToggle);

                const vocabContainer = document.createElement('div');
                vocabContainer.className = 'vocab-container';
                vocabContainer.style.display = 'none';
                flashcardContainer.appendChild(vocabContainer);

                // Tambahkan checkbox "Tampilkan hiragana" di dalam container bab
                const controlsDiv = document.createElement('div');
                controlsDiv.className = 'controls-container';
                controlsDiv.innerHTML = `
                    <label style="cursor: pointer;">
                        <input type="checkbox" class="hiragana-toggle" checked> Tampilkan hiragana
                    </label>
                `;
                vocabContainer.appendChild(controlsDiv);

                const cardsGrid = document.createElement('div');
                cardsGrid.style.display = 'grid';
                cardsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
                cardsGrid.style.gap = '15px';
                cardsGrid.style.marginTop = '10px';
                vocabContainer.appendChild(cardsGrid);

                const checkbox = controlsDiv.querySelector('.hiragana-toggle');

                // Fungsi untuk merender ulang kartu berdasarkan status checkbox hiragana
                const renderCards = () => {
                    cardsGrid.innerHTML = '';
                    let lastOpenedCard = null;

                    rawData[bab].forEach(entry => {
                        const kanjiOrHira = entry[0] || entry[1];
                        const hiragana = entry[1];
                        const arti = entry[2];
                        const showHira = checkbox.checked;

                        const flashcard = document.createElement('div');
                        flashcard.className = 'flashcard';

                        // Mengatur isi kartu awal berdasarkan status checkbox hiragana
                        if (entry[0] && showHira) {
                            flashcard.innerHTML = `<span class="card-sub">${hiragana}</span>${kanjiOrHira}`;
                        } else {
                            flashcard.innerHTML = kanjiOrHira;
                        }

                        flashcard.onclick = () => {
                            const isShowingInitial = flashcard.getAttribute('data-flipped') !== 'true';

                            if (lastOpenedCard && lastOpenedCard !== flashcard) {
                                const prevEntry = lastOpenedCard.entryData;
                                const prevShowHira = checkbox.checked;
                                if (prevEntry[0] && prevShowHira) {
                                    lastOpenedCard.innerHTML = `${prevEntry[0] || prevEntry[1]}<span class="card-sub">${prevEntry[1]}</span>`;
                                } else {
                                    lastOpenedCard.innerHTML = prevEntry[0] || prevEntry[1];
                                }
                                lastOpenedCard.setAttribute('data-flipped', 'false');
                            }

                            if (isShowingInitial) {
                                flashcard.textContent = arti;
                                if (hiragana) {
                                    speakSentence(hiragana);
                                }
                                lastOpenedCard = flashcard;
                                flashcard.entryData = entry;
                                flashcard.setAttribute('data-flipped', 'true');
                            } else {
                                if (entry[0] && showHira) {
                                    flashcard.innerHTML = `${kanjiOrHira}<span class="card-sub">${hiragana}</span>`;
                                } else {
                                    flashcard.innerHTML = kanjiOrHira;
                                }
                                flashcard.setAttribute('data-flipped', 'false');
                                lastOpenedCard = null;
                            }
                        };

                        cardsGrid.appendChild(flashcard);
                    });
                };

                // Event listener saat checkbox diubah
                checkbox.onchange = renderCards;

                // Render pertama kali (tertutup/hidden isi card-nya)
                babToggle.onclick = () => {
                    document.querySelectorAll('.vocab-container').forEach(container => {
                        if (container !== vocabContainer) {
                            container.style.display = 'none';
                        }
                    });
                    const isOpen = vocabContainer.style.display === 'block';
                    vocabContainer.style.display = isOpen ? 'none' : 'block';
                    if (!isOpen) {
                        renderCards();
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
        questionCard.textContent = "Selesai! Skor benar: " + score + " dari " + questions.length;
        choicesContainer.innerHTML = "";
        nextBtn.style.display = "none";
        return;
    }

    const q = questions[currentIndex];
    const kanji = q[0] || q[1];
    speak = q[1];
    correctAnswer = q[2];

    // --- UBAH BAGIAN INI ---
    const showHiraQuiz = document.getElementById("quizHiraganaToggle")?.checked ?? true;
    
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
    allChoices.forEach(choice => {
        const btn = document.createElement("button");
        btn.textContent = choice;
        btn.onclick = () => handleAnswer(btn, choice);
        choicesContainer.appendChild(btn);
    });
}

        function handleAnswer(button, choice) {
            const buttons = document.querySelectorAll(".choices button");
            buttons.forEach(btn => btn.disabled = true);
            if (choice === correctAnswer) {
                button.classList.add("correct");
                score++;
            } else {
                button.classList.add("wrong");
                buttons.forEach(btn => {
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
            const otherChoices = shuffle(data.filter(item => item[2] !== correct))
                .slice(0, 3)
                .map(item => item[2]);
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

            data.forEach(item => {
                const li = document.createElement("li");
                li.textContent = `${item[0] ? item[0] + ' - ' : ''}${item[1]} (${item[2]})`;
                listElement.appendChild(li);
            });

            document.getElementById("modal").style.display = "flex";
        };