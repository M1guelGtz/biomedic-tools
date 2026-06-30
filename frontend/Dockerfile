# --- Etapa 1: build de la app React ---
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# La URL de la API se inyecta en tiempo de build.
ARG VITE_API_URL=http://localhost:4000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# --- Etapa 2: servir los estáticos con Nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
