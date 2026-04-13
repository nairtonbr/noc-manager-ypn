# Use a Node.js base image
FROM node:20-slim AS base

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-slim AS runner
WORKDIR /app

# Install a simple static server for the SPA
RUN npm install -g serve

# Copy build artifacts from base
COPY --from=base /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]
