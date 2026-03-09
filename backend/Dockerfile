# Gunakan slim agar kompatibel dengan binary workerd
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 8787
CMD ["sh", "./entrypoint.sh"]