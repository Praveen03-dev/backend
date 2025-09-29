# Use an official lightweight Node.js image
FROM node:22-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json & package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on
EXPOSE 4000

# Start the app
CMD ["node", "src/server.js"]
