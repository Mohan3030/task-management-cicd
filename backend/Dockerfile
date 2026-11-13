
FROM node:24

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY --chown=node:node . .

# Run application as a non-root user
USER node

EXPOSE 5001

CMD ["npm", "start"]
