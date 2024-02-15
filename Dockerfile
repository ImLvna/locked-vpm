FROM node:21.5.0-alpine

ENV NODE_ENV=development

RUN npm install -g pnpm
WORKDIR /src
COPY package.json pnpm-lock.yaml ./

ENV HUSKY=0

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

RUN pnpm prune --prod

CMD ["pnpm", "start"]