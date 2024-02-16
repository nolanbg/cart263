let speechSynthesizer;
let languages = [
    { text: "Hello World", lang: "en-US" }, 
    { text: "Hola Mundo", lang: "es-ES" }, 
    { text: "Bonjour le monde", lang: "fr-FR" }, 
    { text: "Hallo Welt", lang: "de-DE" }, 
    { text: "Ciao mondo", lang: "it-IT" }, 
    { text: "こんにちは世界", lang: "ja-JP" }, 
    { text: "Привет мир", lang: "ru-RU" }, 
    { text: "你好，世界", lang: "zh-CN" } 
];
let currentLanguageIndex = 0;
let yPos = 100;

function setup() {
    createCanvas(640, 480);
    speechSynthesizer = new p5.Speech();
    frameRate(1); // Set the frame rate to 1 frame per second
}

function draw() {
    background(255);
    fill(0);
    textSize(24);

    // Update the vertical position and language
    yPos = random(550, height - 550);
    currentLanguageIndex = (currentLanguageIndex + 1) % languages.length;

    // Set the language for speech synthesis
    speechSynthesizer.setLang(languages[currentLanguageIndex].lang);
    speechSynthesizer.speak(languages[currentLanguageIndex].text);

    // Display the text
    text(languages[currentLanguageIndex].text, 10, yPos);
}