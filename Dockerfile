# Build Angular, sert les fichiers statiques avec nginx (SPA).
# Pas de script d’entrée maison : évite CRLF Windows → « exec …: no such file or directory ».
# L’ordre de démarrage est géré par docker-compose (depends_on ai-gateway: healthy).
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration=production

FROM nginx:1.27-alpine
# Sortie @angular/build:application → dist/<nom-projet>/browser
COPY --from=build /app/dist/mon-projet/browser /usr/share/nginx/html
COPY nginx-ws-map.conf /etc/nginx/conf.d/00-ws-map.conf
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# ENTRYPOINT/CMD par défaut de l’image nginx : /docker-entrypoint.sh puis nginx
