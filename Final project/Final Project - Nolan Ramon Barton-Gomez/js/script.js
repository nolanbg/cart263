"use strict";

// Variables initialization
let state = 'loading';
let video, cocossd, predictions = [], currentSentence = 0, currentSpokenWord = null;
let words = [];
const sentences = [
    'We fall dissolve unlike snowflakes. Faces cultures melt together like ice cream in scorching sun. We stare into blank eyes growing formless beast interlinking us. What can we reap nothing sow? When we can everywhere so we have nowhere. It will beat you hands knees in your naivety you will search reason. You will seldom find such thing this creature crosses eyes open wound mouth. You want be uncorrupted? Your monstrous soul just as wretched as blood drooling amorphous beast it stares at in indignation. You stupid boy love shaped hole in your heart you pour sedatives into. There’s bluebird in my heart that wants get out but I’m too tough him, I say, stay in there, I’m going let anybody see you. Greed has poisoned men’s souls, has barricaded world hate, has goose-stepped us into misery bloodshed. We have developed speed, but we have shut ourselves in. Machinery that gives abundance has left us want. Our knowledge has made us cynical. Our cleverness, hard unkind. We think too much feel too little. More than machinery we need humanity. More than cleverness we need kindness gentleness. Without these qualities, life will be violent all will be lost…'
];

// Speech synthesis setup
let speech = new p5.Speech();
speech.onEnd = () => {
    if (currentSpokenWord) currentSpokenWord.color = [255, 0, 0]; // Reset color after speech
    currentSpokenWord = null;
};

// p5.js setup function
function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    video.elt.onloadeddata = () => {
        console.log("Video data is loaded");
        cocossd = ml5.objectDetector('cocossd', {}, () => {
            cocossd.detect(video, gotResults);
            state = 'running';
        });
    };

    let currentWords = sentences[currentSentence].split(/\s+/);
    currentWords.forEach(word => words.push({
        text: word,
        x: random(width),
        y: random(height),
        opacity: 100,
        fadeRate: random(0.5, 2),
        size: random(10, 30),
        color: [255, 0, 0]
    }));
}

// Random word speech function
function speakRandomWord() {
    let randomIndex = floor(random(words.length));
    let randomWord = words[randomIndex];
    speech.speak(randomWord.text);
    currentSpokenWord = randomWord;
    currentSpokenWord.color = [255, 255, 255];
}

// Running state function
function running() {
    let aspectRatio = video.width / video.height;
    let renderWidth = min(width, height * aspectRatio);
    let renderHeight = renderWidth / aspectRatio;
    let x = (width - renderWidth) / 2;
    let y = (height - renderHeight) / 2;

    image(video, x, y, renderWidth, renderHeight);
    drawEdgeGradient();
    drawWords();
    applyOverlayOnDevices();
}

// Draw words function
function drawWords() {
    words.forEach(word => {
        fill(...word.color, word.opacity);
        textFont('Neuropol');
        textSize(word.size);
        text(word.text, word.x, word.y);
        if (word !== currentSpokenWord) {
            word.opacity -= word.fadeRate;
            if (word.opacity <= 0) resetWord(word);
        }
    });
}

// Reset word attributes
function resetWord(word) {
    word.x = random(width);
    word.y = random(height);
    word.opacity = 255;
    word.fadeRate = random(0.5, 2);
    word.size = random(10, 30);
}

// Draw edge gradient function
function drawEdgeGradient() {
    let gradient = drawingContext.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    drawingContext.fillStyle = gradient;
    drawingContext.fillRect(0, 0, width, height);
}

// Overlay on detected devices
function applyOverlayOnDevices() {
    predictions.forEach(prediction => {
        if (['cell phone', 'laptop', 'tv'].includes(prediction.label)) {
            fill(255, 0, 0);
            noStroke();
            textSize(24);
            textAlign(CENTER, TOP);
            text(prediction.label.toUpperCase(), prediction.x + prediction.width / 2, prediction.y + prediction.height + 24);
            stroke(255, 0, 0);
            strokeWeight(2);
            noFill();
            rect(prediction.x, prediction.y, prediction.width, prediction.height);
        }
    });
}

// Drawing function
function draw() {
    if (state === 'loading') {
        background(255);
        textSize(18);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text('Loading CocoSsd...\nOnce Initialized, show the webcam a screen and click on it', width / 2, height / 2);
    } else {
        running();
    }
}

// Results handling from object detection
function gotResults(err, results) {
    if (err) {
        console.error(err);
    } else {
        predictions = results;
        cocossd.detect(video, gotResults);
    }
}

// Mouse interaction for predictions
function mousePressed() {
    predictions.forEach(prediction => {
        if (mouseX >= prediction.x && mouseX <= prediction.x + prediction.width &&
            mouseY >= prediction.y && mouseY <= prediction.y + prediction.height &&
            ['cell phone', 'laptop', 'tv'].includes(prediction.label)) {
            window.location.href = 'index2.html';
        }
    });
}
