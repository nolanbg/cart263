let video, overlayVideo, cocossd, predictions = [];
let audioContext, analyser, dataArray, bufferLength, audioBufferSourceNode;
let state = 'loading'; // Initial state

function setup() {
    let cnv = createCanvas(640, 480);
    cnv.style('display', 'block');
    cnv.style('margin', 'auto');
    video = createCapture(VIDEO);
    video.hide();

    overlayVideo = createVideo(['assets/images/alb_vdbk2438_1080p_24fps.mp4'], videoLoaded);
    overlayVideo.hide();

    cocossd = ml5.objectDetector('cocossd', modelReady);
}

function reloadVideoOverlay() {
    if (cocossd && video) {
        cocossd.detect(video, gotResults);
        console.log('Video overlay reloaded.');
    }
}

// Setup audio context and analyser
async function setupAudio(file) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
    }
    try {
        const response = await fetch(file);
        const arrayBuffer = await response.arrayBuffer();
        audioContext.decodeAudioData(arrayBuffer, buffer => {
            if (audioBufferSourceNode) audioBufferSourceNode.stop();
            audioBufferSourceNode = audioContext.createBufferSource();
            audioBufferSourceNode.buffer = buffer;
            audioBufferSourceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioBufferSourceNode.start();
        }, e => console.error("Error decoding audio data: ", e));
    } catch (e) {
        console.error("Failed to fetch the audio file: ", e);
    }
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

function videoLoaded() {
    overlayVideo.loop();
    overlayVideo.volume(0);
    console.log("Overlay video loaded and is now playing.");
}

function modelReady() {
    console.log('Model loaded!');
    cocossd.detect(video, gotResults);
    state = 'running';
}

function gotResults(err, results) {
    if (err) {
        console.error(err);
        return;
    }
    predictions = results;
    cocossd.detect(video, gotResults);
}

function draw() {
    clear();
    if (state === 'running') {
        let volume = drawVisualizer();
        running(volume);
        drawEdgeGradient();
    } else {
        loading();
    }
}

function loading() {
    background(255);
    textSize(18);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text('Loading model and resources...\nPlease wait', width / 2, height / 2);
}

function drawEdgeGradient() {
    let gradient = drawingContext.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    drawingContext.fillStyle = gradient;
    drawingContext.fillRect(0, 0, width, height);
}

function drawVisualizer() {
    if (!dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    let midX = width / 2;
    let barWidth = midX * 2 / dataArray.length;
    let barHeight;

    for (let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 255 * height;
        sum += dataArray[i];
        fill(255, 0, 0, 255);
        rect(midX - i * barWidth, height - barHeight, barWidth, barHeight);
        rect(midX + i * barWidth, height - barHeight, barWidth, barHeight);
    }
    return sum / dataArray.length;
}

// Function to manage visuals during running state
function running(volume) {
    image(video, 0, 0, width, height);
    let opacity = map(volume, 0, 128, 0.2, 1) * 2; // Maps the volume to a range between 0.2 and 1
    tint(255, opacity);
    drawDistortedVideo(volume);
    applyOverlayOnPersons(opacity, volume);
    noTint();
    setGIFOpacity(volume);
    setGIFStyles(volume);
    setEmblemOpacity(volume);
}

function setEmblemOpacity(volume) {
    let emblemOpacity = map(volume, 0, 128, 0.2, 1) + 0.3; // Adjust these values as needed
    document.getElementById('emblem-image').style.opacity = emblemOpacity;
}

// Function to adjust the opacity and width of GIFs based on the volume
function setGIFStyles(volume) {
    // Map the volume to a suitable opacity range
    let opacity = map(volume, 0, 128, 0.2, 1) * 0.8;
    // Map the volume to a width range
    let width = map(volume, 0, 128, 10, 30) * -2; // Width range from 10% to 30%
    // Apply styles to the left image
    let leftImage = document.getElementById('left-image');
    leftImage.style.opacity = opacity;
    leftImage.style.width = `${width}%`;
    // Apply styles to the right image
    let rightImage = document.getElementById('right-image');
    rightImage.style.opacity = opacity;
    rightImage.style.width = `${width}%`;
}

function setGIFOpacity(volume) {
    let opacity = map(volume, 0, 128, 0.2, 1) * 0.8; // Map the volume to a suitable opacity range
    document.getElementById('left-image').style.opacity = opacity;
    document.getElementById('right-image').style.opacity = opacity;
}

function drawDistortedVideo(volume) {
    let pixelOpacity = map(volume, 0, 128, 100, 255) + 0.3;
    video.loadPixels();
    let pixelSize = 6;
    for (let y = 0; y < height; y += pixelSize) {
        for (let x = 0; x < width; x += pixelSize) {
            let index = 4 * (y * width + x);
            let r = video.pixels[index] + random(-30, 30);
            let g = video.pixels[index + 1] + random(-30, 30);
            let b = video.pixels[index + 2] + random(-30, 30);
            fill(r, g, b, pixelOpacity * 0.65);
            noStroke();
            rect(x, y, pixelSize, pixelSize);
        }
    }
}

function applyOverlayOnPersons(opacity, volume) {
    let videoOpacity = map(volume, 0, 128, 50, 255) * 1.25 + 0.5;
    tint(255, videoOpacity) * 1.5;
    predictions.forEach(prediction => {
        if (prediction.label === 'person') {
            let mask = createBoundingBoxMask(prediction.width, prediction.height);
            let overlayFrame = overlayVideo.get();
            overlayFrame.resize(prediction.width, prediction.height);
            overlayFrame.mask(mask);
            image(overlayFrame, prediction.x, prediction.y);
        }
    });
    noTint();
}

// New Audio Control Functions
function changeSong(songFile) {
    setupAudio(songFile); // Adjust the audio context to use the new song
    const audio = document.getElementById('myAudio');
    audio.src = songFile;
    audio.load();  // Ensure new source is loaded
    audio.play();  // Optionally start playing the new song
}

function adjustPitch() {
    const audio = document.getElementById('myAudio');
    audio.playbackRate = document.getElementById('pitch-slider').value;
}

function adjustSpeed() {
    const audio = document.getElementById('myAudio');
    audio.playbackRate = document.getElementById('speed-slider').value;
}

function adjustVolume() {
    const audio = document.getElementById('myAudio');
    audio.volume = document.getElementById('volume-slider').value;
}

function pauseAudio() {
    const audio = document.getElementById('myAudio');
    audio.pause();
}

function restartAudio() {
    const audio = document.getElementById('myAudio');
    audio.currentTime = 0;  // Resetting the time
    audio.play();  // Starting playback again
}

function createBoundingBoxMask(w, h) {
    let graphics = createGraphics(w, h);
    graphics.noStroke();

    let edgeFade = 30; // Width of the gradient edge
    let cornerFade = edgeFade * sqrt(2); // Diagonal length for corner fading

    // Create a gradient for each edge
    for (let i = 0; i < edgeFade; i++) {
        let alpha = map(i, 0, edgeFade, 0, 255);
        // Top gradient
        graphics.fill(255, alpha);
        graphics.rect(0, i, w, 1);
        // Bottom gradient
        graphics.rect(0, h - i - 1, w, 1);
        // Left gradient
        graphics.rect(i, 0, 1, h);
        // Right gradient
        graphics.rect(w - i - 1, 0, 1, h);
    }

    // Apply a smoother gradient at the corners
    for (let y = 0; y < edgeFade; y++) {
        for (let x = 0; x < edgeFade; x++) {
            let distanceToCorner = dist(x, y, edgeFade, edgeFade);
            if (distanceToCorner <= cornerFade) {
                let alpha = map(distanceToCorner, 0, cornerFade, 0, 255);
                graphics.fill(255, alpha);
                // Top-Left corner
                graphics.rect(x, y, 1, 1);
                // Top-Right corner
                graphics.rect(w - x - 1, y, 1, 1);
                // Bottom-Left corner
                graphics.rect(x, h - y - 1, 1, 1);
                // Bottom-Right corner
                graphics.rect(w - x - 1, h - y - 1, 1, 1);
            }
        }
    }

    // Fill the rest of the mask to full opacity
    graphics.fill(255);
    graphics.rect(edgeFade, edgeFade, w - 2 * edgeFade, h - 2 * edgeFade);

    return graphics;
}