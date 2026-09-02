# Debian-based (not alpine) — the postbuild prerender step launches Puppeteer's
# bundled Chromium, which needs glibc and the shared libs Alpine/musl lacks
# by default. Only affects this build stage; the shipped image below is
# still the small nginx:alpine one.
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY . .

# Baked in at build time — CRA/craco inline REACT_APP_* vars into the JS bundle.
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# `yarn build` runs craco build, then automatically runs the "postbuild"
# script (scripts/prerender.js) which prerenders /, /guides and every
# /guides/:slug into static HTML under build/ before this stage ends.
RUN yarn build

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
