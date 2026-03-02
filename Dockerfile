# ---------- Stage 1: build ----------
FROM node:20-alpine AS builder

# set working dir
WORKDIR /app

# copy package definition and install deps
COPY package*.json ./
RUN npm ci --only=production

# copy rest of sources
COPY . .

# compile TypeScript to JavaScript
RUN npm run build


# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runner

WORKDIR /app

# copy compiled output and production deps only
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# copy any runtime files (e.g. .env.example) if needed
#COPY .env.example .

# set NODE_ENV by default
ENV NODE_ENV=production

EXPOSE 3000

# start the compiled server
CMD ["node", "dist/index.js"]
