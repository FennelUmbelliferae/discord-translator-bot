# Use an official Node runtime as a parent image
FROM node:18-alpine

# Install curl and wget for healthchecks
RUN apk add --no-cache curl wget

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the current directory contents into the container
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Run the app when the container launches
CMD ["node", "bot.js"]
