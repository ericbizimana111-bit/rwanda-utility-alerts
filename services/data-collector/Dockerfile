FROM python:3.13-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    TZ=Africa/Kigali
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY src ./src
# Check REG and WASAC every 30 minutes.
CMD ["python", "-m", "src.main", "--every", "30"]
