// Get the video element
const video = document.getElementById('video');

// Prompt user for video access
function setupCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing the camera: ', error);
        });
}

// Load the model and predict
function detectFaces() {
    const faceapi = ml5.faceApi(video, { withLandmarks: true, withExpressions: true }, modelLoaded);

    function modelLoaded() {
        console.log('Model Loaded!');
        faceapi.detect(gotResults);
    }

    function gotResults(error, results) {
        if (error) {
            console.error(error);
            return;
        }

        console.log(results);
        if (results.length > 0) {
            // Display detected expressions
            console.log('Expressions: ', results[0].expressions);
        }

        faceapi.detect(gotResults); // Call it again to continuously detect
    }
}

// Setup the camera and face detection
setupCamera();
video.onloadedmetadata = () => {
    detectFaces();
};