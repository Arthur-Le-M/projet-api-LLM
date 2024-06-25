FROM ubuntu:latest

RUN apt-get update && apt-get install -y \
    fuse \
    wget \
    libglib2.0-0 \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libsecret-1-0 \
    libasound2t64 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://releases.lmstudio.ai/linux/x86/0.2.25/beta/LM_Studio-0.2.25.AppImage && \
    chmod u+x LM_Studio-0.2.25.AppImage

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

