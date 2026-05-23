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

# Copy package manifests first for layer caching
COPY package.json ./

# Full install (not --omit=dev, not npm ci) for two reasons:
#   1. npx resolves binaries from node_modules/.bin — a partial install can leave
#      the remotion binary absent even when @remotion/cli is in dependencies.
#   2. npm ci uses the lock file's platform-specific compositor packages, which were
#      built for win32-x64 on the dev machine and won't work on linux-x64 here.
RUN npm install

# Confirm the @remotion/cli binary is wired up (visible in Railway build logs)
RUN ls node_modules/.bin | grep remotion

# Download Chromium Headless Shell used by Remotion renderer.
# Use the direct binary path — npx finds the base `remotion` package first (it has
# no bin field) and exits with "could not determine executable to run".
RUN ./node_modules/.bin/remotion browser ensure

# Copy the rest of the source
COPY . .

# Temp dir for in-flight render files
RUN mkdir -p temp/out

EXPOSE ${PORT:-3001}

CMD ["npm", "run", "start"]
