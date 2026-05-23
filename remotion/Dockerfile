FROM node:20-bookworm-slim

# System dependencies required by Chromium and FFmpeg on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    ffmpeg \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    wget \
    xdg-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Diagnostic: print which package.json the build context is giving us.
# Railway build logs will show this — if it does NOT contain @remotion/cli
# then Railway is using the repo root as build context instead of remotion/.
COPY package.json ./
RUN echo "=== package.json received by Docker ===" && cat package.json && echo "==="

# Full npm install — resolves linux-x64 platform compositor packages
# regardless of what the lock file captured on the developer's Windows machine.
RUN npm install

# Copy the rest of the source files
COPY . .

# Temp dir for in-flight render files
RUN mkdir -p temp/out

EXPOSE ${PORT:-3001}

# browser ensure runs at container startup rather than at build time.
# This avoids build failures if the binary path changes, and ensures
# Chromium is downloaded into the running container's filesystem.
# tsx is used directly from node_modules/.bin to avoid npx resolution ambiguity.
CMD ["sh", "-c", "./node_modules/.bin/remotion browser ensure && ./node_modules/.bin/tsx server.ts"]
