from node:16
WORKDIR /app
COPY package.json .
RUN npm install 
COPY . .
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
CMD ["npm", "start"]