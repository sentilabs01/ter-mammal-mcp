# Claude Code Container
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=18

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    gnupg \
    software-properties-common \
    build-essential \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 18+
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Create app directory
WORKDIR /app

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Copy MCP server implementation
COPY mcp-server.js .
COPY package.json .

# Install dependencies
RUN npm install

# Create non-root user
RUN useradd --create-home --shell /bin/bash claude
RUN chown -R claude:claude /app
USER claude

# Expose MCP port
EXPOSE 8001

# Health check endpoint
COPY health-check.js .

# Start MCP server
CMD ["node", "mcp-server.js"]