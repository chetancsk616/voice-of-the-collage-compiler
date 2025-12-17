FROM node:18

# Install build tools and runtime interpreters for code execution
RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root and server package files
COPY package.json ./
COPY server/package.json ./server/

# Install dependencies
RUN npm install
RUN cd server && npm install && cd ..

# Copy server code
COPY server/executor-server.js ./server/
COPY server/executor ./server/executor/
COPY server/utils ./server/utils/

# Copy .env if it exists, otherwise create a default one
COPY .env* ./
RUN if [ ! -f .env ]; then echo "PORT=5000" > .env; fi

EXPOSE 5000

# Run the executor server (subprocess-based, no Docker required)
CMD ["node", "server/executor-server.js"]
