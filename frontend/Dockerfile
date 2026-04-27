# Build stage
FROM node:20 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80