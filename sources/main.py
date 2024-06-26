from typing import Union
from fastapi import FastAPI, File, UploadFile, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import whisper
from openai import OpenAI
import os
from TTS.api import TTS
from fastapi.responses import FileResponse
from auth import auth_router, get_current_user, UserInDB
import requests

#Init
app = FastAPI()

model = whisper.load_model("base")

client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

url = "http://127.0.0.1:5000/v1/chat/completions"

headers = {
    "Content-Type": "application/json"
}

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)

#CORS
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclure le routeur d'authentification depuis auth.py
app.include_router(auth_router)

#Request

@app.get("/getUser")
async def get_user_route(current_user: UserInDB = Depends(get_current_user)):
    """
    Route pour tester l'authentification en récupérant l'utilisateur authentifié.
    """
    return {"user": current_user}

#Transcribe with Whisper
@app.post("/transcribe/")
async def transcribe_audio_request(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)) -> Union[str, dict]:
    """
    Transcribes the audio file uploaded by the user.
    """
    transcription = await transcribe_audio(file)
    return {"transcription": transcription}
    

#Speak with LLM
@app.get("/speak/")
async def speak_with_llm_request(context: str = Query(...), prompt: str = Query(...), current_user: UserInDB = Depends(get_current_user)) -> Union[str, dict]:
    """
    Speaks with OpenAI Language Model (LLM).
    """
    response = await speak_with_llm(context, prompt)
    return {"response": response}

#Make TTS
@app.get("/tts/")
async def make_tts_request(text: str = Query(...), current_user: UserInDB = Depends(get_current_user)) -> Union[str, dict]:
    """
    Converts the text to speech.
    """
    filePath = await make_tts(text)
    return FileResponse(filePath, media_type="audio/wav", filename="output.wav")


#Conversation
@app.post("/conversation/")
async def conversation(file: UploadFile = File(...), current_user: UserInDB = Depends(get_current_user)) -> Union[str, dict]:
    """
    Transcribes the audio file uploaded by the user and speaks with OpenAI Language Model (LLM).
    """
    #Print filename
    print(file.content_type)
    print("Transcribing audio...")
    transcription = await transcribe_audio(file)
    print(transcription)
    print("Speaking with LLM...")
    response = await speak_with_llm("Tu es un agent IA là pour aider, tu ne fais que des réponse courte", transcription)
    print(response)
    print("Making TTS...")
    filePath = await make_tts(response)
    return FileResponse(filePath, media_type="audio/wav", filename="output.wav")
    


#Fonctions
async def speak_with_llm(context: str, prompt: str):
    """
    Speaks with OpenAI Language Model (LLM).
    """
    try:
        history = []
        user_message = prompt
        history.append({"role": "assistant", "content": context})
        history.append({"role": "user", "content": user_message})
        data = {
        "mode": "chat",
        "messages": history
        }
        response = requests.post(url, headers=headers, json=data, verify=False)
        assistant_message = response.json()['choices'][0]['message']['content']
        history.append({"role": "assistant", "content": assistant_message})
        return assistant_message
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
async def transcribe_audio(file):
    """
    Transcribes the audio file uploaded by the user.
    """
    try:
        if file.content_type.startswith("audio/"):
            with open(file.filename, "wb") as f:
                f.write(await file.read())
            
            transcription = model.transcribe(file.filename)
            
            # Remove the audio file after transcription
            f.close()
            os.remove(file.filename)
        return transcription["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

async def make_tts(text):
    """
    Converts the text to speech.
    """
    try:
        filePath = "output.wav"
        tts.tts_to_file(text=text, file_path=filePath, speaker="Ana Florence", language="fr") 
        return filePath
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")