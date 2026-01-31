FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias y compila el frontend
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine

# Configuración de Nginx para servir el frontend y hacer proxy al backend
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
