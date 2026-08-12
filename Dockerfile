FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache font-dejavu \
  texlive \
  texmf-dist \
  texmf-dist-latexrecommended \
  texmf-dist-latexextra \
  texmf-dist-mathscience \
  texmf-dist-fontsrecommended \
  texmf-dist-fontsextra \
  texmf-dist-pictures

COPY package.json pnpm-lock.yaml* ./

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

CMD ["sh", "-c", "node dist/index.js"]
