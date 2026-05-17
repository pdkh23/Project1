FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/requirements-render.txt ./requirements-render.txt
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements-render.txt

COPY backend ./

EXPOSE 10000

CMD ["/bin/sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PORT:-10000}"]
