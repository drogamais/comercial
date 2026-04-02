FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Garante que as dependências de SSO (PyJWT) estejam instaladas
RUN pip install PyJWT cryptography

COPY . .

EXPOSE 5001

# Roda em Produção (Waitress pré-configurado no run.py)
CMD ["python", "run.py"]
