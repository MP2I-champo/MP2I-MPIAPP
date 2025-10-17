FROM node:23-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache font-dejavu

COPY package.json pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["sh", "-c", "node dist/index.js"]
