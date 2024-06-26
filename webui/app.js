document.addEventListener('DOMContentLoaded', (event) => {
    openTab('transcriptionTab');
});

const token = localStorage.getItem('token');

function openTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    
    // Hide all tab contents
    tabContents.forEach((tabContent) => {
        tabContent.classList.remove('active');
        tabContent.style.display = 'none';
    });
    
    // Remove active class from all tab buttons
    tabButtons.forEach((tabButton) => {
        tabButton.classList.remove('active');
        tabButton.classList.add('inactive');
    });
    
    // Show the selected tab content
    const activeTab = document.getElementById(tabId);
    activeTab.classList.add('active');
    activeTab.style.display = 'block';
    
    // Add active class to the corresponding tab button
    const activeButton = document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`);
    activeButton.classList.add('active');
    activeButton.classList.remove('inactive');
}

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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
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

const speakButton = document.getElementById('speakButton');
const contextInput = document.getElementById('context');
const promptInput = document.getElementById('prompt');
const llmResponseDisplay = document.getElementById('llmResponse');

speakButton.addEventListener('click', async () => {
    const context = contextInput.value;
    const prompt = promptInput.value;

    if (context && prompt) {
        llmResponseDisplay.innerText = "Processing...";
        
        try {
            const url = new URL('http://localhost:8000/speak/');
            url.searchParams.append('context', context);
            url.searchParams.append('prompt', prompt);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur du serveur: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            llmResponseDisplay.textContent = result.response;
        } catch (error) {
            console.error('Erreur lors de la requête LLM:', error);
            llmResponseDisplay.innerText = "Erreur lors de la requête LLM. Veuillez réessayer.";
        }
    } else {
        llmResponseDisplay.innerText = "Veuillez remplir le contexte et le prompt.";
    }
});

const textToSpeechButton = document.getElementById('textToSpeechButton');
const textToSpeechInput = document.getElementById('textToSpeech');
const audioElement = document.getElementById('audio');

textToSpeechButton.addEventListener('click', async () => {
    const text = textToSpeechInput.value;

    if (text) {
        try {
            const url = new URL('http://localhost:8000/tts/');
            url.searchParams.append('text', text);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error(`Erreur du serveur: ${response.status} ${response.statusText}`);
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioElement.src = audioUrl;
            audioElement.style.display = 'block';
        } catch (error) {
            console.error('Erreur lors de la synthèse vocale:', error);
            alert("Erreur lors de la synthèse vocale. Veuillez réessayer.");
        }
    } else {
        alert("Veuillez entrer du texte pour la synthèse vocale.");
    }
});