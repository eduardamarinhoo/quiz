FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN VITE_BASE_PATH=/quiz/ npm run build
EXPOSE 3000
CMD ["node", "server.js"]
