# Gemini CLI Container
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20+
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Install Gemini CLI globally
RUN npm install -g @google/gemini-cli

# Copy MCP server implementation
COPY mcp-server.js .
COPY package.json .

# Install dependencies
RUN npm install

# Create non-root user
RUN useradd --create-home --shell /bin/bash gemini
RUN chown -R gemini:gemini /app
USER gemini

# Expose MCP port
EXPOSE 8002

# Health check endpoint
COPY health-check.js .

# Start MCP server
CMD ["node", "mcp-server.js"]