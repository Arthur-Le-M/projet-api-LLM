const micButton = document.getElementById('micButton');
const audioRecords = document.getElementById('audioRecords');
let isRecording = false;
let audioChunks = [];
let mediaRecorder;

const token = localStorage.getItem('token');

navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.wav');
            micButton.src = 'img/loading.svg';

            try {
                const response = await fetch('http://localhost:8000/conversation/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });

                if (response.ok) {
                    micButton.src = 'img/micro.svg';
                    const responseBlob = await response.blob();
                    const responseUrl = URL.createObjectURL(responseBlob);
                    audioRecords.src = responseUrl;
                    audioRecords.play();
                } else {
                    console.error('Error from server:', response.statusText);
                }
            } catch (error) {
                console.error('Error:', error);
            }

            audioChunks = [];
        };
    });

micButton.addEventListener('click', () => {
    if (!isRecording) {
        // Start recording
        mediaRecorder.start();
        micButton.src = 'img/stop_mic.svg'; // Change to recording image
        isRecording = true;
    } else {
        // Stop recording
        mediaRecorder.stop();
        micButton.src = 'img/micro.svg'; // Change back to original image
        isRecording = false;
    }
});