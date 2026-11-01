# ---- build the static site ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Optional one-click demo logins on the sign-in page (baked in at build time).
ARG VITE_DEMO=false
ARG VITE_DEMO_PASSWORD=
ENV VITE_DEMO=$VITE_DEMO VITE_DEMO_PASSWORD=$VITE_DEMO_PASSWORD
RUN npm run build

# ---- serve it, and forward /api and /media to the API ----
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
