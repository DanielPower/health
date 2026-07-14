FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile=false
COPY apps/web apps/web
RUN pnpm --filter @health/web build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --prod --frozen-lockfile
WORKDIR /app/apps/web
COPY --from=build /app/apps/web/build ./build
EXPOSE 3000
CMD ["node", "build"]
