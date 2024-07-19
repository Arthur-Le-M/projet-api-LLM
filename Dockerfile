FROM nvidia/cuda:11.8.0-cudnn8-devel-rockylinux8

RUN dnf install -y \
    wget \
    curl \
    git \
    && dnf clean all

RUN dnf install -y \
    https://mirrors.rpmfusion.org/free/el/rpmfusion-free-release-8.noarch.rpm \
    https://mirrors.rpmfusion.org/nonfree/el/rpmfusion-nonfree-release-8.noarch.rpm \
    epel-release \
    && dnf config-manager --set-enabled powertools \
    && dnf install -y SDL2 \
    && dnf install -y ffmpeg \
    && dnf clean all

RUN wget --quiet https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh \
    && /bin/bash ~/miniconda.sh -b -p /opt/conda \
    && rm ~/miniconda.sh

ENV PATH="/opt/conda/bin:$PATH"

RUN /opt/conda/bin/conda install -y pip setuptools wheel

#XTTS & STT

RUN conda create -n xtts python=3.9 -y \
    && conda init bash \
    && echo "conda activate xtts" >> ~/.bashrc \
    && . ~/.bashrc

RUN python -m venv venv \
&& source venv/bin/activate

RUN pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 torchaudio===2.1.0+cu118 -f https://download.pytorch.org/whl/torch_stable.html \
&& pip install tts \
&& pip install openai-whisper


#API 

WORKDIR /

RUN git clone https://github.com/Arthur-Le-M/projet-api-LLM.git
    
WORKDIR /projet-api-LLM

RUN pip install --upgrade pip setuptools wheel \
    && pip install -r requirements.txt
    
# fastapi run sources/main.py to start the API
EXPOSE 8000

# Command to run the FastAPI application
#CMD ["uvicorn", "sources.main:app", "--host", "0.0.0.0", "--port", "8000"]