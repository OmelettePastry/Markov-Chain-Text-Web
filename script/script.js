const createTextButton = document.querySelector('#create-text-button');
const ourTextBox = document.querySelector('#input-text');
const outputText = document.querySelector('#output-text');

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

// parses the input text and returns the next word and current index
function getNextItem(ourText, index) {
    let wordComplete = false;   // determines if our item is complete
    let word = "";
    let character = "";

    while(wordComplete === false && index < ourText.length) {

        // get current character in the input text at current index
        character = ourText[index];

        // if the character is a letter, add it to the our word
        if (isLetter(character)) {
            word += character;
            index++;
        }

        // if the character is a hyphen
        else if (character === "-") {

            // part of a dash (two hyphens, "--")
            if ((index < ourText.length - 1) && (ourText[index + 1] === "-")) {

                // if we already have characters in our word, then the word is complete (exit loop and return)
                if (word.length > 0) {
                    wordComplete = true;
                }

                // if our word is empty, then let our word be "--" and increment index by 2 and let the word be complete
                else {
                    word = "--";
                    wordComplete = true;
                    index += 2;
                }
            }

            // if this hypen is part of a hyphenated word, then continue adding to our word
            else if ((index < ourText.length) && (isLetter(ourText[index + 1]))) {
                word += character;
                index++;
            }

            // if this is not a dash or hyphenated word, then just add the hypphen and let the word be complete
            else {
                word += character;
                wordComplete = true;
                index++;
            }
        }

        // if our item is a punctuation mark
        else if (punct.includes(character)) {

            // punctuation mark is at end of a word, then exit the loop (this will return the word only)
            if (word.length > 0) {
                wordComplete = true;
            }

            // if the punctuation is the only character in the word, return the word
            else {
                word += character;
                wordComplete = true;
                index++;
            }
        }
        else {

            // if our character is neither a letter or punctuation mark, and the previous character was a letter, then return the word without this current character
            // e.g., an "@" symbol at the end of a word would be ignored and the current word would be returned
            if ((index > 0) && isLetter(ourText[index - 1])) {
                wordComplete = true;
                index++;
            }

            // if our character is not a letter or punctuation mark, and it's by itself, then return an empty word
            else {
                wordComplete = true;
                word = "";
                index++;
            }
        }
    }

    return [word, index];
}

// This function takes in a string and and returns a dictionary of words as key values, and occurances of successive words and their number of occurances as values
//
// Dictionary example structure ==> wordDict = { "string1" : { "nextWordA" : 2,
//                                                           { "nextWordB" : 3 },
//                                               "string2" : { "nextWordA" : 1,
//                                                           { "nextWordA" : 4 } };

function getWords(ourText) {
    let wordDict = {};              // dictionary
    let index = 0;                  // index of 'ourText' string
    let originalElement = null;     // holds the previous element (word or punctuation string)
    let element, info;              // element holds a word or some punctuation
                                    // info holds an array that contains the element and index

    // This loop processes the input text string, and adds appropriate data to the wordDict dictionary
    while(index < ourText.length) {
        info = getNextItem(ourText, index);
        element = info[0];
        index = info[1];

        // This code block determines if the item is in the dictionary and also if it is in the subdictionary of the previous item (if applicable)
        if (element != "") {
            // if item is not in the dictionary, add item (as key) to dictionary and its value as an empty dictionary
            if(!(element in wordDict)) {
                wordDict[element] = {};
            }

            // if this is NOT the first word in the text
            if (originalElement != null) {

                // if the current item is not in the previous item's subdictionary, then let its value be 1
                if(!(element in wordDict[originalElement])) {
                    wordDict[originalElement][element] = 1;
                }

                // if the current item is in the previous item's subdictionary, then increment its count
                else {
                    let value = wordDict[originalElement][element]
                    value++;
                    wordDict[originalElement][element] = value;
                }
            }

            // let the current item be the previous item in the next iteration
            originalElement = element;
        }
    }

    let total = 0;

    // This loop normalizes the dictionary values so that they sum to 1.0
    //
    // Normalizes the occurances of each successive word
    // Example normalization from the above dictionary example structure
    // Normalized dictionary example structure ==>  wordDict = { "string1" : { "nextWordA" : 0.4,
    //                                                                       { "nextWordB" : 0.6 },
    //                                                           "string2" : { "nextWordA" : 0.2,
    //                                                                       { "nextWordA" : 0.8 } };

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

// Selects a random item based upon weights (probabilities)
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

// This function generates our random text
function createMarkovText() {

    let ourText = ourTextBox.value;     // input text
    let sentence = "";                  // this is our randomly generated sentence string
    let wordDict = getWords(ourText);   // get our word dictionary
    let capitalized = false;            // Boolean that determines if a word has its first letter capitalized

    // get all our dictionary keys
    ourKeys = Object.keys(wordDict);

    // loop to determine if there is a naturally capitalized word
    for (let i = 0; i < ourKeys.length; i++) {
        ourKey = ourKeys[i];
        if ((ourKey.charCodeAt(0) >= 65) && (ourKey.charCodeAt(0) <= 90)) {
            capitalized = true;
        }
    }

    // choose a random key ??
    let word = ourKeys[Math.floor(Math.random() * ourKeys.length)];

    // Retrieves a naturally capitalized word (if it exists), otherwise choose a random word
    if (capitalized) {
        while (!(word.charCodeAt(0) >= 65 && word.charCodeAt(0) <= 90)) {
            word = ourKeys[Math.floor(Math.random() * ourKeys.length)];
        }
    } else {
        while (!(word.charCodeAt(0) >= 65 && word.charCodeAt(0) <= 90) && !(word.charCodeAt(0) >= 97 && word.charCodeAt(0) <= 122)) {
            word = ourKeys[Math.floor(Math.random() * ourKeys.length)];
        }
    }

    // add our first word to our sentence
    sentence += word;
    
    let end = false;
    let periodCounter = 0;
    let prevWord = "";

    let subWordList = [];
    let weights = [];


    // our loop that iteratively adds a word to our sentence, until we find a period or we find a word with no other word coming after it
    while(end == false) {
        subWordList = Object.keys(wordDict[word]);      // get keys of the subdictionary (these are all words that appear immediately after our original word)
        weights = Object.values(wordDict[word]);        // get the probabilities of our succesive words

        // Retrieve our word based upon our probabilities
        word = weightedRandom(subWordList, weights);    // choose a random successive word using the probabilites

        // if our item is a punctuation (as listed in our 'punct' variable at the beginning of our code) or a dash (here, we treat it as a double hyphen, "--"), then we add it to our sentence
        if (isPunc(word) || word === "--") {
            sentence += word;
        }

        // This 'else if' block adds a word to our sentence. 
        // if our item is a word (thus, not empty, not undefined or is not a space)
        else if (word != "" && word != " " && word != undefined) {

            // previous item was a dash, add item to sentence (no space)
            if (prevWord == "--") {
                sentence += word;
            }

            // our item is a word, and we add it to our sentence, and include a space
            else {
                sentence = sentence + " " + word;
            }
        }

        // Determines if an end punctuation mark was encountered, if so increment periodCounter
        if (word === "." || word === "?" || word === "!") {
            periodCounter++;
        }

        // Ends our loop if a preiod, question mark or exclamation point was encountered OR if there are no words that come after the current word
        if ((periodCounter > 0) || (word == undefined)) {
            end = true;
        }

        // Stores the current item as the previous item for the next iteration (used for dashes)
        prevWord = word;

    }

    // Output our text
    outputText.textContent = sentence;
    outputText.style.visibility = 'visible';
}