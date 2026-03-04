FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install --production=false
COPY entrypoint.sh ./entrypoint.sh
EXPOSE 4000
CMD ["./entrypoint.sh"]
