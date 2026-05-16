# Base image
FROM node:20-alpine

# Working directory
WORKDIR /app

# Dependencies copy
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]