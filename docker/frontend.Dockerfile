# Stage 1: Builder
FROM node:22-alpine as builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
ARG VITE_ARCGIS_ACCESS_TOKEN=""
ARG VITE_ESRI_IMAGERY_URL=""
ARG VITE_ESRI_LABELS_URL=""
ENV VITE_ARCGIS_ACCESS_TOKEN=${VITE_ARCGIS_ACCESS_TOKEN}
ENV VITE_ESRI_IMAGERY_URL=${VITE_ESRI_IMAGERY_URL}
ENV VITE_ESRI_LABELS_URL=${VITE_ESRI_LABELS_URL}
RUN npm run build

# Stage 2: Runtime
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
