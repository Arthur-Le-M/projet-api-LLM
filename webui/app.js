const uploadButton = document.getElementById('uploadButton');
const fileNameDisplay = document.getElementById('fileName');
const recordButton = document.getElementById('recordButton');
const statusText = document.getElementById('status');
const transcribeButton = document.getElementById('transcribeButton');
const transcriptionDisplay = document.getElementById('transcription');

let mediaRecorder;
let audioChunks = [];
let formData = new FormData();
let recordingStatus = 0; // 0: not recording, 1: recording

uploadButton.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        formData = new FormData(); // Reset formData
        formData.append('file', file); // Append the selected file
    }
});

recordButton.addEventListener('click', async () => {
    if (recordingStatus === 0) {
        recordButton.innerText = "Stop";
        statusText.innerText = "Recording...";
        recordingStatus = 1;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.onstart = () => {
            audioChunks = [];
        };
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            formData = new FormData(); // Reset formData
            formData.append('file', audioBlob); // Append the recorded audio blob
        };

        mediaRecorder.start();
    } else {
        recordButton.innerText = "Record";
        statusText.innerText = "Click on record button to record your voice or upload your audio file";
        recordingStatus = 0;
        mediaRecorder.stop();
    }
});

transcribeButton.addEventListener('click', async () => {
    if (formData.has('file')) {
        statusText.innerText = "Transcription en cours...";
        
        try {
            // Envoyer l'audio au serveur pour transcription
            const response = await fetch('http://localhost:8000/transcribe/', { 
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Erreur du serveur: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            transcriptionDisplay.textContent = result.transcription;
            statusText.innerText = "Transcription terminée";
        } catch (error) {
            console.error('Erreur lors de la transcription:', error);
            statusText.innerText = "Erreur lors de la transcription. Veuillez réessayer.";
        }
    } else {
        statusText.innerText = "Aucun fichier audio sélectionné ou enregistré.";
    }
});
