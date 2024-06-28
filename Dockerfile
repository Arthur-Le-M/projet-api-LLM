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

RUN conda create -n xtts python=3.9 -y \
    && conda init bash \
    && echo "conda activate xtts" >> ~/.bashrc \
    && . ~/.bashrc \
    && pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 torchaudio===2.1.0+cu118 -f https://download.pytorch.org/whl/torch_stable.html \
    && pip install tts