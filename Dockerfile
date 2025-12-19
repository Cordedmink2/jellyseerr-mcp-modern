FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build && npm prune --omit=dev

ENV PORT=3000
ENV JELLYSEERR_URL=""
ENV JELLYSEERR_API_KEY=""
ENV JELLYSEERR_TIMEOUT=15
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["node", "dist/index.js", "--transport=http"]
