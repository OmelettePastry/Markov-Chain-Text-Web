const createTextButton = document.querySelector('.createText');
const ourTextBox = document.querySelector('.textBox');
const outputText = document.querySelector('.outputText');

createTextButton.addEventListener('click', createMarkovText);

let punct = ["!", ",", ".", ";", "?", ":"];

// Find the number of items in our object
Object.size = function(obj) {
    var size = 0,
      key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function isLetter(character) {
    if (character.length === 0) {
        return false;
    }
    else {
        let ascii = character.charCodeAt(0);
        let result = (ascii >= 65 && ascii <= 90) || (ascii >= 97 && ascii <= 122) || ascii == 39;
        return result;
    }
}

// Replaced by the includes method
function isPunc(character) {
    
    isPunctuation = false;
    
    for (let i = 0; i < punct.length; i++) {
        if(character === punct[i]) {
            isPunctuation = true;
        }
    }

    return isPunctuation;
}

function getNextItem(ourText, index) {
    let wordComplete = false;
    let word = "";
    let character = "";

    while(wordComplete === false && index < ourText.length) {
        character = ourText[index];

        if (isLetter(character)) {
            word += character;
            index++;
        }
        else if (character === "-") {
            if ((index < ourText.length - 1) && (ourText[index + 1] === "-")) {
                if (word.length > 0) {
                    wordComplete = true;
                }
                else {
                    word = "--";
                    wordComplete = true;
                    index += 2;
                }
            }
            else if ((index < ourText.length) && (isLetter(ourText[index + 1]))) {
                word += character;
                index++;
            }
            else {
                word += character;
                wordComplete = true;
                index++;
            }
        }
        else if (punct.includes(character)) {
            if (word.length > 0) {
                wordComplete = true;
            }
            else {
                word += character;
                wordComplete = true;
                index++;
            }
        }
        else {
            if ((index > 0) && isLetter(ourText[index - 1])) {
                wordComplete = true;
                index++;
            }
            else {
                wordComplete = true;
                word = "";
                index++;
            }
        }
    }
    return [word, index];
}

function getWords(ourText) {
    let wordDict = {};
    let index = 0;
    let originalElement = null;
    let element, info;

    // loop while we have not processed the whole string
    while(index < ourText.length) {
        info = getNextItem(ourText, index);
        element = info[0];
        index = info[1];

        if (element != "") {
            // if item is not in the object, add to object with value of empty object
            if(!(element in wordDict)) {
                wordDict[element] = {};
            }

            // if object has at least one property
            if (originalElement != null) {
                if(!(element in wordDict[originalElement])) {
                    wordDict[originalElement][element] = 1;
                }
                else {
                    let value = wordDict[originalElement][element]
                    value++;
                    wordDict[originalElement][element] = value;
                }
            }
            originalElement = element;
        }
    }

    let total = 0;

    // Calculate probabilities for each transition
    for (const first in wordDict) {
        total = 0;

        for (const nextWord in wordDict[first]) {
            total += wordDict[first][nextWord];
        }

        for (const nextWord in wordDict[first]) {
            let probability = wordDict[first][nextWord] / total;
            wordDict[first][nextWord] = probability;
        }
    }
    return wordDict;
}

function weightedRandom(items, weights) {

    let i;
    for (i = 0; i < weights.length; i++)
        weights[i] += weights[i - 1] || 0;

    var random = Math.random() * weights[weights.length - 1];

    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;

    return items[i];
}

function createMarkovText() {

    let ourText = ourTextBox.value;
    let sentence = "";
    let wordDict = getWords(ourText);

    keys = Object.keys(wordDict);
    let word = keys[Math.floor(Math.random() * keys.length)];

    while (!(word.charCodeAt(0) >= 65 && word.charCodeAt(0) <= 90)) {
        word = keys[Math.floor(Math.random() * keys.length)];
    }

    sentence += word;
    
    let end = false;
    let periodCounter = 0;
    let prevWord = "";

    let subWordList = [];
    let weights = [];


    while(end == false) {
        subWordList = Object.keys(wordDict[word]);
        weights = Object.values(wordDict[word]);
        word = weightedRandom(subWordList, weights);

        if (isPunc(word) || word === "--") {
            sentence += word;
        }
        else if (word != "" && word != " ") {
            if (prevWord == "--") {
                sentence += word;
            }
            else {
                sentence = sentence + " " + word;
            }
        }

        if (word === "." || word === "?" || word === "!") {
            periodCounter++;
        }

        if (periodCounter > 0) {
            end = true;
        }

        prevWord = word;

        outputText.textContent = sentence;
        outputText.style.visibility = 'visible';
    }
}