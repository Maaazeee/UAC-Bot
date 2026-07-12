FROM node:24-alpine
RUN apk add --no-cache python3 make g++ ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install pm2 -g
COPY . .
RUN mkdir -p logs data
EXPOSE 8080
CMD ["pm2-runtime", "index.js", "--name", "uac-bot"]
