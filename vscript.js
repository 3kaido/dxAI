let translator;
let prompter;

async function searchWord(word) {
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const wordContent = document.getElementById('wordContent');
    wordContent.innerHTML = '';

    if (data.length > 0) {
      const entry = data[0];
      const wordInfoTemplate = document.getElementById('wordInfoTemplate');
      const wordInfoContent = wordInfoTemplate.content.cloneNode(true);
      wordInfoContent.querySelector('.word').textContent = entry.word;

      if (entry.phonetic) {
        const phoneticElement = wordInfoContent.querySelector('.phonetic');
        phoneticElement.textContent = `(${entry.phonetic})`; // Added parentheses
      }

      const meaningsElement = wordInfoContent.querySelector('.meanings');

      entry.meanings.forEach(meaning => {
        const meaningTemplate = document.getElementById('meaningTemplate');
        const meaningContent = meaningTemplate.content.cloneNode(true);
        meaningContent.querySelector('h3').textContent = meaning.partOfSpeech;

        meaning.definitions.forEach(async definition => {
          const definitionTemplate = document.getElementById('definitionTemplate');
          const definitionContent = definitionTemplate.content.cloneNode(true);

          // Get the definition prefix element
          const definitionPrefix = definitionContent.querySelector('.d-prefix');
          // Add click listener to the definition prefix
          definitionPrefix.addEventListener('click', () => {
            speakText(definition.definition, 'en-US');
          });
          // Set the definition text (inside the new span)
          const definitionTextElement = definitionContent.querySelector('.definition-text');
          definitionTextElement.innerHTML = linkify(definition.definition);

          const pHolderDiv = definitionContent.querySelector('.example-pHolder')

          // try Gemini Translate local.
          translateDiv(definition.definition, definitionContent.querySelector('.definition-translated'));

          const definitionsElement = meaningContent.querySelector('.definitions');

          if (definition.example) {
            constructNewQuiz(definition.example, pHolderDiv, entry.word, definition.definition);
          } else {
            const newSentense = await aiGenenateExample(entry.word, definition.definition);
            constructNewQuiz(newSentense, pHolderDiv,entry.word, definition.definition);
          }
          definitionsElement.appendChild(definitionContent);
        });

        meaningsElement.appendChild(meaningContent);
      });

      wordContent.appendChild(wordInfoContent);

      const wordElement = document.getElementById('wordHead');
      wordElement.addEventListener('click', () => {
        speakText(entry.word, 'en-US');
      });
    } else {
      wordContent.innerHTML = '<p>Word not found. Try random word buttons above.</p>';
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    document.getElementById('wordContent').innerHTML = '<p>Error fetching data.</p>';
  }
}


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Functions to play sound effects (replace with your actual sound implementation)
function playBeepSound() {
  // ... (implementation to play "beep" sound) ...
  // You can use the Audio API or any other sound library
}

function playPingSound() {
  // ... (implementation to play "ping" sound) ...
  // You can use the Audio API or any other sound library
}

function linkify(sentence) {
  const words = sentence.split(/\s+/);
  const linkedWords = words.map(word => {
    const cleanWord = word.replace(/[^a-zA-Z]/g, "");
    const wordLower = cleanWord.toLowerCase();

    // Get current language from URL
    const currentLang = getLanguageFromURL();

    // Construct the URL with search parameters
    let url = `?word=${cleanWord}&lang=${currentLang}`;

    // Add the appropriate class based on word frequency
    let wordClass = "";
    if (essential500Words.includes(wordLower)) {
      wordClass = "essential-500";
    } else if (essential1000Words.includes(wordLower)) {
      wordClass = "essential-1000";
    } else if (essential2000Words.includes(wordLower)) {
      wordClass = "essential-2000";
    } else if (essential4000Words.includes(wordLower)) {
      wordClass = "essential-4000";
    } else {
      wordClass = "moreThan4000";
    }

    return `<a href="${url}" class="${wordClass}">${word}</a>`;
  });

  const linkedDefinition = linkedWords.join(" ");
  return `<span>${linkedDefinition}</span>`;
}

function speakText(text, lang = 'en-US', rate = 1.0) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

async function aiGenenateExample(word, definition) {
  const ask = `Please make a new short sentense, using the word "${word}", 
  which should mean - "${definition}" in its context.
  Do not put any docoration around the word, like **word**. 
  No need other explanation, just a new sentense.`;

  // Prompt the model and wait for the whole result to come back.
  const result = await prompter.prompt(ask);
  return result;
}

async function translateDiv(text, div) {
  if (translator) { // Check if translator is initialized
    try {
      div.innerHTML = await translator.translate(text);
    } catch (err) {
      console.error(err.name, err.message);
    }
  } else {
    console.error('Translator not available');
  }
}

function constructNewQuiz(exampleSentence, pHolderDiv, word, definition) {
  pHolderDiv.innerHTML = '' //init.
  const exampleTemplate = document.getElementById('exampleTemplate'); // Get the example template
  const exampleContent = exampleTemplate.content.cloneNode(true); // Clone the example template content
  const exampleElement = exampleContent.querySelector('.example');

  const answerDiv = exampleElement.querySelector('.answer');
  const sentenceContainer = exampleElement.querySelector('.sentenseContainer');
  answerDiv.innerHTML = linkify(exampleSentence);

  // Get the buttons container from the template
  const buttonsContainer = exampleElement.querySelector('.buttons-container');

  // The Reveal button
  const showButton = buttonsContainer.querySelector('.show-button');
  showButton.addEventListener('click', () => {
    exampleElement.classList.add("complete");
    sentenceContainer.style.display = "none";
    answerDiv.style.display = "block";
    currentWordIndex = 0;
    const wordButtons = exampleElement.querySelectorAll('.wordButton');
    wordButtons.forEach(button => {
      button.disabled = 'disabled';
    });
  });
  // Gemini Generator
  const geminiExampleButton = buttonsContainer.querySelector('.gemini');
  geminiExampleButton.addEventListener('click', async () => {
    const newSentense = await aiGenenateExample(word, definition);
    constructNewQuiz(newSentense, pHolderDiv, word, definition);
  });

  // Try Local Translate
  const translateButton = buttonsContainer.querySelector('.translate-button');
  translateButton.addEventListener('click', () => {
    translateDiv(exampleSentence, exampleElement.querySelector('.answer-translated'), true);
  });

  // Add the listen buttons
  const listenButton = buttonsContainer.querySelector('.listen-button');
  listenButton.addEventListener('click', () => {
    speakText(exampleSentence, 'en-US', listenButton.dataset.speed);
  });

  const listenSlowButton = buttonsContainer.querySelector('.slow-button');
  listenSlowButton.addEventListener('click', () => {
    speakText(exampleSentence, 'en-US', listenSlowButton.dataset.speed);
  });
  const listenSlowerButton = buttonsContainer.querySelector('.slower-button');
  listenSlowerButton.addEventListener('click', () => {
    speakText(exampleSentence, 'en-US', listenSlowerButton.dataset.speed);
  });

  const words = exampleSentence.trim().split(/\s+/);

  // Create an array of objects to store words with their original indices
  const wordsWithIndices = words.map((word, index) => ({ word, originalIndex: index }));

  shuffleArray(wordsWithIndices);

  let currentWordIndex = 0;
  let revealedSentence = "";

  const wordButtonsContainer = exampleContent.querySelector('.wordButtonsContainer');
  wordButtonsContainer.innerHTML = ''; // Clear previous buttons

  wordsWithIndices.forEach(({ word, originalIndex }) => {
    const button = document.createElement('button');
    button.classList.add("wordButton");
    button.textContent = word;
    button.onclick = () => {
      if (originalIndex === currentWordIndex) {
        revealedSentence += (revealedSentence ? " " : "") + word;
        sentenceContainer.textContent = revealedSentence;
        currentWordIndex++;
        button.disabled = true;

        if (currentWordIndex === wordsWithIndices.length) {
          // Quiz Complete!
          exampleElement.classList.add("complete");
          sentenceContainer.style.display = "none";
          answerDiv.style.display = "block";
          playPingSound();
        }
      } else {
        playBeepSound();
      }
    };
    wordButtonsContainer.appendChild(button);
  });
  pHolderDiv.appendChild(exampleElement); // Replace the placeholder with the cloned example content
}


// Add an event listener to the language selector
const langSelector = document.getElementById('langSelector');
langSelector.addEventListener('change', async () => {
  const word = getWordFromURL();
  const lang = langSelector.value;
  updateURL(word, lang); // Update the URL with the new language

  // Rebuild the translator with the new target language
  if ('createTranslator' in self.translation) {
    try {
      translator = await self.translation.createTranslator({
        sourceLanguage: 'en',
        targetLanguage: lang
      });
    } catch (err) {
      console.error(err.name, err.message);
    }
  }
  searchWord(word); // Re-run the search with the selected language
});

init();
async function init() {
  if ('createTranslator' in self.translation) {
    //Init Translator
    try {
      translator = await self.translation.createTranslator({
        sourceLanguage: 'en',
        targetLanguage: getLanguageFromURL()
      });
    } catch (err) {
      console.error(err.name, err.message);
    }
  }
  //Init prompt API.
  if (ai.languageModel) {
    prompter = await ai.languageModel.create({
      systemPrompt: "You are a kind, Junior highschool level English teacher."
    });
  
  }

  const wordFromURL = getWordFromURL();
  const langFromURL = getLanguageFromURL();
  document.getElementById('langSelector').value = langFromURL;

  window.scrollTo(0, 0); //PageTop
  document.getElementById('wordInput').value = wordFromURL;
  searchWord(wordFromURL);
}

function getWordFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('word') || 'dictionary';
}

function getLanguageFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('lang') || 'ja'; // Default to 'ja' if not found
}

function changeByUserInputWord() {
  //Invoked by Button Click
  const currentWord = document.getElementById('wordInput').value;
  updateURL(currentWord, getLanguageFromURL());
}

function updateURL(word, lang) {
  const params = new URLSearchParams(window.location.search);
  params.set('word', word);
  params.set('lang', lang);
  document.getElementById('wordInput').value = word;
  document.getElementById('langSelector').value = lang;
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  history.replaceState({}, '', newUrl); // Use replaceState to update URL
  window.scrollTo(0, 0); //PageTop
  searchWord(word);
}
