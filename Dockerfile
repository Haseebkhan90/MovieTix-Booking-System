FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
CMD ["sh", "scripts/start.sh"]
