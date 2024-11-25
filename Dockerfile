# Use the official Nginx image as the base image
FROM nginx:alpine

# Copy the custom Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the static website files to the Nginx HTML directory
COPY . /usr/share/nginx/html

# Expose port 4000
EXPOSE 4000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
