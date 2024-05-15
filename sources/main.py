from typing import Union
from fastapi import FastAPI, File, UploadFile, Query, HTTPException
import whisper
from openai import OpenAI

#Init
app = FastAPI()
model = whisper.load_model("base")
client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")
#Request

#Transcribe with Whisper
@app.post("/transcribe/")
async def transcribe_audio(file: UploadFile = File(...)) -> Union[str, dict]:
    """
    Transcribes the audio file uploaded by the user.
    """
    if file.content_type.startswith("audio/"):
        with open(file.filename, "wb") as f:
            f.write(await file.read())
        
        transcription = model.transcribe(file.filename)
        
        return {"transcription": transcription["text"]}
    else:
        return "Invalid file format. Please upload an audio file."
    

#Speak with LLM
@app.get("/speak/")
async def speak_with_llm(context: str = Query(...), prompt: str = Query(...)) -> Union[str, dict]:
    """
    Speaks with OpenAI Language Model (LLM).
    """
    try:
        # Create a chat completion with OpenAI LLM
        completion = client.chat.completions.create(
            model="lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF",
            messages=[
                {"role": "system", "content": context},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
        )
        # Extract the response from LLM
        print(completion.choices[0].message.content)
        return {"response": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")