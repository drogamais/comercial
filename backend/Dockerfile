FROM node:20-slim

# Instalar o OpenSSL (compatível com o Prisma no Debian)
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm install

# Copiar o resto do código
COPY . .

# Gerar o cliente Prisma
RUN npx prisma generate

# Entrypoint que roda migrations antes de iniciar o servidor
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["/entrypoint.sh"]