# Gunakan slim agar kompatibel dengan binary workerd
FROM node:20-slim

WORKDIR /app

# Salin package files
COPY package*.json ./

# Install dependensi (termasuk wrangler yang ada di devDependencies)
RUN npm install

# Salin sisa kode
COPY . .

# Ekspos port wrangler
EXPOSE 8787

# Gunakan npx untuk menjalankan wrangler lokal dari node_modules
CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--remote=false"]