FROM node:22-bookworm AS builder

WORKDIR /usr/local/app

COPY package*.json ./

COPY prisma ./prisma

COPY prisma.config.ts ./

ARG DATABASE_URL

RUN npm install && npm run prisma:generate

COPY . .

RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS runner

RUN npm install -g npm@11.9.0


COPY --from=builder --chown=node:node /usr/local/app/prisma ./prisma
COPY --from=builder --chown=node:node /usr/local/app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=node:node /usr/local/app/generated ./generated
COPY --from=builder --chown=node:node /usr/local/app/dist ./dist
COPY --from=builder --chown=node:node /usr/local/app/node_modules ./node_modules
COPY --from=builder --chown=node:node /usr/local/app/package*.json ./

# sharp ships a platform+libc-specific native binary resolved at install
# time — the builder stage above is glibc (bookworm) but this runner stage
# is musl (alpine), so the binary installed there won't load here. Refetch
# just sharp's binary for this stage's actual platform.
RUN npm install --cpu=x64 --os=linux --libc=musl sharp

USER node

EXPOSE 3000

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:prod" ]
