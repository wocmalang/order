# Build stage
FROM node:20-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine AS production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Jika ada file _routes.json untuk Cloudflare Pages, Nginx tidak membacanya secara otomatis, 
# tapi file statis sudah ada di /dist
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]