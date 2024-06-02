FROM node:18.20.3-alpine@sha256:5069da655539e2e986ce3fd1757f24a41b846958566c89ff4a48874434d73749

ARG USER_ID
ARG USER_NAME
ARG USER_GROUP_ID
ARG USER_GROUP_NAME

# Add PNPM.
RUN npm install -g pnpm@9.1.4

# Mirror the host user inside the image. Needed when using rootful Docker.
# USER_NAME and USER_GROUP_NAME are required if the user is non-root.
RUN if [ -n "${USER_GROUP_NAME}" ] && [ -n "${USER_NAME}" ] && [ "${USER_NAME}" != "root" ] && if [ -n "${USER_ID}" ]; then [ ${USER_ID} -ne 0 ]; fi; then \
        echo "Remove user" && \
        if getent passwd "${USER_NAME}"; then \
            deluser "${USER_NAME}" \
        ;fi && \
        if [ -n "${USER_ID}" ] && getent passwd "${USER_ID}"; then \
            deluser "$(getent passwd "${USER_ID}" | cut -d':' -f1)" \
        ;fi && \
        echo "Remove group" && \
        if getent group "${USER_GROUP_NAME}"; then \
            delgroup "${USER_GROUP_NAME}" || true \
        ;fi && \
        if [ -n "${USER_GROUP_ID}" ] && getent group "${USER_GROUP_ID}"; then \
            delgroup "$(getent group "${USER_GROUP_ID}" | cut -d':' -f1)" || true \
        ;fi && \
        echo "Add group" && \
        if [ -n "${USER_GROUP_ID}" ]; then \
            addgroup -g "${USER_GROUP_ID}" "${USER_GROUP_NAME}" || true \
        ;else \
            addgroup "${USER_GROUP_NAME}" || true \
        ;fi && \
        echo "Add user" && \
        if [ -n "${USER_ID}" ]; then \
            adduser -u "${USER_ID}" -s /bin/sh -G "${USER_GROUP_NAME}" -DH "${USER_NAME}" \
        ;else \
            adduser -s /bin/sh -G "${USER_GROUP_NAME}" -DH "${USER_NAME}" \
        ;fi \
    ;fi

USER ${USER_NAME:-root}