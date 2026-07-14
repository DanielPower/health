FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim
WORKDIR /app
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY pyproject.toml ./
COPY uv.lock ./
COPY services/scale-collector/pyproject.toml services/scale-collector/pyproject.toml
RUN uv sync --frozen --no-dev --package health-scale-collector
COPY services/scale-collector/src services/scale-collector/src
ENV PYTHONPATH=/app/services/scale-collector/src
CMD ["uv", "run", "uvicorn", "health_scale_collector.main:app", "--host", "0.0.0.0", "--port", "8000"]
