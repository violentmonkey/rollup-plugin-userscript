FROM node:18.20.3-alpine@sha256:5069da655539e2e986ce3fd1757f24a41b846958566c89ff4a48874434d73749

# Add PNPM.
RUN npm install -g pnpm@9.1.4

ARG USER_ID
ARG USER_NAME
ARG USER_GROUP_ID
ARG USER_GROUP_NAME

# Mirror the host user inside the image to fix permission issues when using rootful Docker.
ARG USER_ID
ARG USER_NAME
ARG USER_GROUP_ID
ARG USER_GROUP_NAME
RUN if [ -n "${USER_GROUP_NAME}" -a -n "${USER_NAME}" -a "${USER_NAME}" != "root" ] && if [ -n "${USER_ID}" ]; then [ ${USER_ID} -ne 0 ]; fi; then \
        echo "Remove user" && \
        if getent passwd "${USER_NAME}" 1>/dev/null 2>&1; then \
            echo "    $(getent passwd ${USER_NAME})" && \
            deluser "${USER_NAME}" \
        ;fi && \
        if [ -n "${USER_ID}" ] && getent passwd "${USER_ID}" 1>/dev/null 2>&1; then \
            echo "    $(getent passwd ${USER_ID})" && \
            deluser "$(getent passwd "${USER_ID}" | cut -d':' -f1)" \
        ;fi && \
        echo "Remove group" && \
        if getent group "${USER_GROUP_NAME}" 1>/dev/null 2>&1; then \
            echo "    $(getent group ${USER_GROUP_NAME})" && \
            delgroup "${USER_GROUP_NAME}" || true \
        ;fi && \
        if [ -n "${USER_GROUP_ID}" ] && getent group "${USER_GROUP_ID}" 1>/dev/null 2>&1; then \
            echo "    $(getent group ${USER_GROUP_ID})" && \
            delgroup "$(getent group "${USER_GROUP_ID}" | cut -d':' -f1)" || true \
        ;fi && \
        echo "Add group" && \
        if [ -n "${USER_GROUP_ID}" ]; then \
            addgroup -g "${USER_GROUP_ID}" "${USER_GROUP_NAME}" || true \
        ;else \
            addgroup "${USER_GROUP_NAME}" || true \
        ;fi && \
        echo "    $(getent group ${USER_GROUP_NAME})" && \
        echo "Add user" && \
        if [ -n "${USER_ID}" ]; then \
            adduser -u "${USER_ID}" -s /bin/sh -G "${USER_GROUP_NAME}" -DH "${USER_NAME}" \
        ;else \
            adduser -s /bin/sh -G "${USER_GROUP_NAME}" -DH "${USER_NAME}" \
        ;fi && \
        echo "    $(getent passwd ${USER_NAME})" \
    ;fi

USER ${USER_NAME:-root}