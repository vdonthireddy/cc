FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY web/package*.json ./
RUN npm install

COPY web/ .
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom config
COPY web/nginx.conf /etc/nginx/conf.d/

# Copy built assets from build stage
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
