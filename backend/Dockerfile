FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./

EXPOSE 10000

CMD ["/bin/sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}"]