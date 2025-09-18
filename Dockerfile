
FROM node:20-alpine

RUN apk add --no-cache openjdk21-jre
RUN apk add --no-cache openjdk17-jre
RUN apk add --no-cache openjdk8-jre

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
