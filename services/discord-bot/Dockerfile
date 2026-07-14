FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/discord-bot/package.json services/discord-bot/package.json
RUN pnpm install --frozen-lockfile
COPY services/discord-bot services/discord-bot
RUN pnpm --filter @health/discord-bot build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/discord-bot/package.json services/discord-bot/package.json
RUN pnpm install --prod --frozen-lockfile
WORKDIR /app/services/discord-bot
COPY --from=build /app/services/discord-bot/dist ./dist
CMD ["node", "dist/index.js"]
