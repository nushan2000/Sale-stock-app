# Build stage
FROM node:20 AS build
WORKDIR /app
# Declaring the ARG and exporting it as ENV is required for the --build-arg passed by
# CI (.github/workflows/main.yml) to actually reach Vite: without both lines, a
# --build-arg is discarded before it ever becomes visible to `npm run build`, and
# import.meta.env.VITE_API_BASE_URL silently falls back to whatever default the code
# has (this was previously masked because the URL was hardcoded directly in JS instead
# of read from this env var).
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm install
RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80