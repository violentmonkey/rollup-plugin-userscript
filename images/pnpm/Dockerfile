FROM node:18.20.3-alpine@sha256:5069da655539e2e986ce3fd1757f24a41b846958566c89ff4a48874434d73749

# Add PNPM.
RUN npm install -g pnpm@9.10.0

COPY entrypoint /entrypoint
ARG GOSU_VERSION=1.17
ARG SETPRIV_VERSION=2.40.1
ARG UTIL_LINUX_VERSION=2.39.3
RUN chmod +x /entrypoint && /entrypoint --setup
ENTRYPOINT ["/entrypoint", "--"]