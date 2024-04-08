"use strict";

let state = 'loading';
let video;
let overlayVideo; // Variable for the additional video
let modelName = 'CocoSsd';
let cocossd;
let predictions = [];
let sentences = ['We fall and dissolve not unlike snowflakes\n\nFaces and cultures melt together like ice cream in the scorching sun\n\nWe stare into the blank eyes of the growing formless beast interlinking us\n\nWhat can we reap with nothing to sow\n\nWhen we can go everywhere so we have nowhere to go\n\n'];
let currentSentence = 0;
let synth = window.speechSynthesis;
let utterance;
let marqueeY = 0; // This will hold the y-position of the marquee text

function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();

    // Load the overlay video
    overlayVideo = createVideo(['assets/images/alb_vdbk2438_1080p_24fps.mp4'], videoLoaded);
    overlayVideo.hide(); // Hide the default video player controls

    cocossd = ml5.objectDetector('cocossd', {}, function () {
        cocossd.detect(video, gotResults);
        state = `running`;
    });
}

function loading() {
    background(255);
    push();
    textFont('Orbitron');
    textSize(18);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(`Loading ${modelName}...\n Once Initialized, click to continue`, width / 2, height / 2);
    pop();
}
function videoLoaded() {
    overlayVideo.loop(); // Play the video in a loop
    overlayVideo.volume(0); // Mute the video
}

function draw() {
    if (state === 'loading') {
        loading();
    } else if (state === `running`) {
        running();
    }
}
function gotResults(err, results) {
    if (err) {
        console.error(err);
    } else {
        predictions = results;
    }
    cocossd.detect(video, gotResults);
}
let previousPixels;

function draw() {
    if (state === 'loading') {
        loading();
    } else if (state === `running`) {
        running();
    }

    // Save the current pixels if the previousPixels is undefined or by chance
    if (!previousPixels || random() < 0.05) {
        video.loadPixels();
        previousPixels = video.pixels;
    }
}
function running() {
    image(video, 0, 0, width, height);
    applyOverlayOnPersons();
    video.loadPixels();

    // Iterate over a smaller set of pixels for performance
    for (let y = 0; y < video.height; y += 8) {
        for (let x = 0; x < video.width; x += 8) {
            let index = (x + y * video.width) * 4;

            // Copy pixels from the previous frame
            video.pixels[index + 0] = previousPixels[index + 0];
            video.pixels[index + 1] = previousPixels[index + 1];
            video.pixels[index + 2] = previousPixels[index + 2];
            video.pixels[index + 3] = previousPixels[index + 3];

            // Randomly offset pixels to create a glitch effect
            if (random() < 0.1) {
                let offsetX = int(random(-20, 20));
                let offsetY = int(random(-20, 20));
                let displacementIndex = ((x + offsetX) + (y + offsetY) * video.width) * 8;
                if (displacementIndex >= 0 && displacementIndex < previousPixels.length) {
                    video.pixels[index + 0] = previousPixels[displacementIndex + 0];
                    video.pixels[index + 1] = previousPixels[displacementIndex + 1];
                    video.pixels[index + 2] = previousPixels[displacementIndex + 2];
                    video.pixels[index + 3] = previousPixels[displacementIndex + 3];
                }
            }
        }
    }

    video.updatePixels();

    // Draw the video to the canvas
    image(video, 0, 0, width, height);

    applyOverlayOnPersons();
    // Y-position of the marquee text
    marqueeY += 2; // Adjust the speed by changing this value
    if (marqueeY > height) {
        marqueeY = -100; 
    }

    // Display the sentence as a marquee on the left side
    push();
    fill(255, 0, 0); // Red text
    textSize(20);
    textFont('Orbitron');
    textAlign(LEFT, TOP);
    text(sentences[currentSentence], 10, marqueeY, 150, height); // Use marqueeY for the y-position
    pop();

    // Display the sentence as a marquee on the right side
    push();
    fill(255, 0, 0); // Red text
    textSize(20);
    textFont('Orbitron');
    textAlign(RIGHT, TOP);
    text(sentences[currentSentence], width - 160, marqueeY, 150, height); // Use marqueeY for the y-position
    pop();
}
function createRadialGradientMask(w, h) {
    let graphics = createGraphics(w, h);
    graphics.noFill();

    // Adjust these values to control the gradient size and opacity
    let maxRadius = min(w, h) / 2; // Starting radius for the gradient
    let minRadius = maxRadius * 0.1; // Radius where the gradient will be fully transparent

    // Create a radial gradient
    for (let r = maxRadius; r > minRadius; r -= 2) {
        let alpha = map(r, minRadius, maxRadius, 0, 255);
        graphics.fill(255, 255, 255, alpha);
        graphics.ellipse(w / 2, h / 2, r * 2, r * 2);
    }

    return graphics;
}
function applyOverlayOnPersons() {
    if (predictions.length > 0) {
        for (let i = 0; i < predictions.length; i++) {
            let object = predictions[i];
            if (object.label === 'person') {
                // Generate a radial gradient mask for each detected person
                let mask = createRadialGradientMask(object.width, object.height);

                // Capture the current frame of the overlay video as an image
                let overlayFrame = overlayVideo.get();
                overlayFrame.resize(object.width, object.height); // Resize to match the object

                // Apply the mask to the overlay frame
                overlayFrame.mask(mask);

                // Create a temporary graphics to draw the masked frame
                let tempGraphics = createGraphics(object.width, object.height);
                tempGraphics.image(overlayFrame, 0, 0);

                // Draw the temporary graphics (with the masked frame) on the canvas
                image(tempGraphics, object.x, object.y);
            }
        }
    }
}

function highlightPerson(object) {
    push();
    fill(255, 0, 0);
    textFont('Orbitron');
    textSize(20);
    text(sentences[currentSentence], object.x + 10, object.y + 20);
    if (currentSentence !== lastSpokenSentence) {
        speakSentence(sentences[currentSentence]);
        lastSpokenSentence = currentSentence;
    }
    pop();
}