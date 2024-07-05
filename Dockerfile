FROM nvidia/cuda:11.8.0-cudnn8-devel-rockylinux8

RUN dnf install -y \
    wget \
    curl \
    git \
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
    && . ~/.bashrc \
    && pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 torchaudio===2.1.0+cu118 -f https://download.pytorch.org/whl/torch_stable.html \
    && pip install tts \
    && pip install openai-whisper

#API 

WORKDIR /

RUN git clone https://github.com/Arthur-Le-M/projet-api-LLM.git
    
WORKDIR /projet-api-LLM
    
# RUN pip install -r requirements.txt
    
# fastapi run sources/main.py to start the API



# #API LLM

# RUN git clone https://github.com/oobabooga/text-generation-webui.git

# WORKDIR /text-generation-webui

# RUN GPU_CHOICE=A USE_CUDA118=FALSE LAUNCH_AFTER_INSTALL=FALSE INSTALL_EXTENSIONS=TRUE ./start_linux.sh --verbose

#./start_linux.sh --api to start the API





