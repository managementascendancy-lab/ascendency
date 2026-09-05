# Debian-based (not alpine) — the postbuild prerender step launches Puppeteer's
# bundled Chromium, which needs glibc and the shared libs Alpine/musl lacks
# by default. Only affects this build stage; the shipped image below is
# still the small nginx:alpine one.
# Node 22 (not 20) because puppeteer@25.9.0 (a devDependency used by
# scripts/prerender.js) declares "engines.node": ">=22.12.0" and refuses
# to install under yarn's engine check otherwise.
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

# yarn's postinstall for puppeteer leaves an incomplete Chrome download
# on this minimal base image — bookworm-slim has no `unzip`, so the
# postinstall's own download can't extract the archive (it swallows
# the error instead of failing the yarn install over it). Install
# `unzip`, clear the partial download, and fetch Chrome explicitly via
# puppeteer's own CLI with --install-deps, which additionally apt-installs
# the shared libraries (glib, nss, atk, cups, x11, etc.) headless Chrome
# needs to actually launch on a stripped-down Debian image — the
# postbuild prerender step below needs a real, complete, launchable Chrome.
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /root/.cache/puppeteer && npx puppeteer browsers install chrome --install-deps \
    && rm -rf /var/lib/apt/lists/*

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
