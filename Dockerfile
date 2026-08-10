FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache font-dejavu

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["sh", "-c", "node dist/index.js"]
