"use strict";

let state = `loading`;
let video;
let modelName = `CocoSsd`;
let cocossd;
let predictions = [];
let sentences = [
    "Ovid told of Narcissus’ story from his birth:",
    "Narcissus was fathered by a river god to a nymph named Liriope.\n Liriope was told by a prophet\n that Narcissus would reach old age\n if he failed to recognize himself.",
    "Narcissus turned into a very beautiful young man,\n whom everyone loved.\n However, there was no one to whom \nNarcissus would return affection.",
    "Echo was a nymph who was destined a fate\n that she could only repeat the sounds \n and last words of others. \n One day she spotted\n and fell in love with Narcissus. \n She followed him through the woods \n but could not speak \nwithout repeating his words.",
    "Finally Narcissus tried to call to Echo, \n but it failed since she could only repeat his call. \n Finally Echo appeared and tried to hold Narcissus. \n Narcissus rejected her and Echo ran to hide. \n Her body then wasted away while she pined for him. \n She is now forever hiding\n amongst the leaves and caves in the forest. \n Her body is gone but her bones became rocks\n and her voice remains\n and can be heard in mountain valleys and in caves. \n Since Narcissus denied everyone his love, \n the gods fated that Narcissus could never have anything that he loved.",
    "One day while Narcissus was hunting he went to get a drink. \n As he bent down to drink the water \n he fell in love with the reflection of himself. \n He was so awed by this person that he could not move. \n He tried to grab the image but couldn’t, \n which made him more infatuated with himself.",
    "Narcissus stayed there without any sleep or food. \n He called to the gods asking why \n he was being denied the love that the two shared. \n He started to talk to the reflection. \n He claimed he would not leave the one he loved \n and that they would die as one.",
    "Crazy with love, \n Narcissus stayed by the side of the water and wasted away. \n Echo returned to see him wasting away. \n She mourned more \n and as he said his farewell to the reflection she echoed his words. \n Narcissus then lay down to die and the nymphs mourned him. \n They covered him with their hair and set up for a funeral. \n When they turned for his body, \n there was a flower instead."
];
let currentSentence = 0;
let synth = window.speechSynthesis; // Access the browser's speech synthesis interface
let utterance; // This will be initialized with each new sentence

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    cocossd = ml5.objectDetector('cocossd', {}, function () {
        cocossd.detect(video, gotResults);
        state = `running`;
    });
}

function gotResults(err, results) {
    if (err) {
        console.error(err);
    } else {
        predictions = results;
    }
    cocossd.detect(video, gotResults);
}

function draw() {
    if (state === `loading`) {
        loading();
    } else if (state === `running`) {
        running();
    }
}

function loading() {
    background(255);
    push();
    textSize(18);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(`Loading ${modelName}...\n Once Initialized, click to continue`, width / 2, height / 2);
    pop();
}

function running() {
    // Draw the video onto the canvas
    image(video, 0, 0, width, height);

    // Censor the entire canvas except for 'person' objects
    censorNonPersons();
}

function censorNonPersons() {
    // Draw a semi-transparent overlay over the entire canvas
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);

    if (predictions) {
        for (let i = 0; i < predictions.length; i++) {
            let object = predictions[i];
            if (object.label === 'person') {
                // Cut out the person area from the overlay
                highlightPerson(object);
            }
        }
    }
}
function calculateDarkness(object, mouseX, mouseY) {
    // Calculate the center of the object
    let centerX = object.x + object.width / 2;
    let centerY = object.y + object.height / 2;

    // Calculate the distance between the mouse and the center of the object
    let distance = dist(mouseX, mouseY, centerX, centerY);

    // The maximum distance will be half the diagonal of the canvas for full darkness
    let maxDistance = dist(0, 0, width / 2, height / 2);

    // Calculate darkness based on distance (closer = darker)
    let darkness = map(distance, 0, maxDistance, 255, 0);

    // Ensure darkness is within 0-255
    darkness = constrain(darkness, 0, 255);

    return darkness;
}
let lastSpokenSentence = -1; 

function highlightPerson(object) {
    push();

    let darkness = calculateDarkness(object, mouseX, mouseY);
    fill(0, 0, 0, darkness);
    rect(object.x, object.y, object.width, object.height);

    fill(255, 0, 0); // Ensure the text color makes it visible over any background
    textSize(20);
    text(sentences[currentSentence], object.x + 10, object.y + 20);

    // Check if the current sentence has changed since last spoken
    if (currentSentence !== lastSpokenSentence) {
        speakSentence(sentences[currentSentence]); // Speak the current sentence
        lastSpokenSentence = currentSentence; // Update the last spoken sentence index
    }

    pop();
}

function speakSentence(sentence) {
    if (synth.speaking) { // If currently speaking, don't interrupt
        console.error('speechSynthesis.speaking');
        return;
    }
    utterance = new SpeechSynthesisUtterance(sentence);
    utterance.pitch = 1; // Set pitch, rate, and volume as needed
    utterance.rate = 1;
    utterance.volume = 1;

    synth.speak(utterance); // Start speaking the sentence
}
function mousePressed() {
    currentSentence = (currentSentence + 1) % sentences.length; // Cycle through sentences
}