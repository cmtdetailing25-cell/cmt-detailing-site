FROM node:20-bookworm-slim

# System dependencies required by Chromium/Remotion on Linux
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
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

# Copy package manifests first for layer caching
COPY package.json ./

# Install deps — npm install (not npm ci) so platform-specific Remotion
# compositor packages are resolved for linux-x64 instead of the lock file's
# win32-x64 entries from the developer's machine.
RUN npm install --omit=dev

# Download Chromium Headless Shell used by Remotion renderer
RUN npx remotion browser ensure

# Copy the rest of the source
COPY . .

# Temp dir for in-flight render files
RUN mkdir -p temp/out

EXPOSE ${PORT:-3001}

CMD ["npm", "run", "start"]
