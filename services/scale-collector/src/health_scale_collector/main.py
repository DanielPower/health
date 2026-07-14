import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import UTC, datetime

import asyncpg
from bleak import BleakScanner
from etekcity_esf551_ble import (
    IMPEDANCE_KEY,
    WEIGHT_KEY,
    ESF551Scale,
    ScaleData,
    detect_model,
)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ScaleCandidate(BaseModel):
    address: str
    name: str
    model: str


class Collector:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url
        self.pool: asyncpg.Pool | None = None
        self.scales: dict[str, ESF551Scale] = {}

    async def start(self) -> None:
        self.pool = await asyncpg.create_pool(self.database_url)
        rows = await self.pool.fetch("SELECT bluetooth_address FROM scale_devices")
        for row in rows:
            await self.start_collection(row["bluetooth_address"])

    async def stop(self) -> None:
        for scale in self.scales.values():
            await scale.async_stop()
        if self.pool:
            await self.pool.close()

    async def scan(self, timeout_seconds: float = 12) -> list[ScaleCandidate]:
        found: dict[str, ScaleCandidate] = {}

        def on_advertisement(device: object, advertisement: object) -> None:
            # Bleak keeps these dynamic values; keeping the callback minimal avoids
            # blocking its event loop.
            model = detect_model(
                advertisement.local_name,
                advertisement.manufacturer_data,
                device.address,  # type: ignore[attr-defined]
            )
            if model:
                found[device.address] = ScaleCandidate(  # type: ignore[attr-defined]
                    address=device.address,  # type: ignore[attr-defined]
                    name=advertisement.local_name or "Etekcity scale",  # type: ignore[attr-defined]
                    model=model.value,
                )

        async with BleakScanner(on_advertisement):
            await asyncio.sleep(timeout_seconds)
        return list(found.values())

    async def pair(self, candidate: ScaleCandidate) -> ScaleCandidate:
        if candidate.model != "ESF-551":
            raise ValueError("Only ESF-551 is supported by this collector")
        assert self.pool
        await self.pool.execute(
            """
            INSERT INTO scale_devices (bluetooth_address, name, model, last_seen_at)
            VALUES ($1, $2, $3, now())
            ON CONFLICT (bluetooth_address) DO UPDATE SET name = EXCLUDED.name, last_seen_at = now()
            """,
            candidate.address,
            candidate.name,
            candidate.model,
        )
        await self.start_collection(candidate.address)
        return candidate

    async def start_collection(self, address: str) -> None:
        if address in self.scales:
            return

        def measurement_callback(data: ScaleData) -> None:
            asyncio.create_task(self.save_measurement(data))

        scale = ESF551Scale(address, measurement_callback)
        self.scales[address] = scale
        await scale.async_start()

    async def save_measurement(self, data: ScaleData) -> None:
        weight = data.measurements.get(WEIGHT_KEY)
        if weight is None or self.pool is None:
            return
        await self.pool.execute(
            """
            INSERT INTO scale_measurements (
              scale_device_id, measured_at, weight_kg, impedance_ohms, raw_measurement
            )
            SELECT id, $2, $3, $4, $5::jsonb FROM scale_devices WHERE bluetooth_address = $1
            """,
            data.address,
            datetime.now(UTC),
            weight,
            data.measurements.get(IMPEDANCE_KEY),
            "{}",
        )


collector = Collector(os.environ["DATABASE_URL"])


@asynccontextmanager
async def lifespan(_: FastAPI):
    await collector.start()
    yield
    await collector.stop()


app = FastAPI(title="Health scale collector", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/v1/scales/scan")
async def scan_scales() -> dict[str, list[ScaleCandidate]]:
    try:
        return {"devices": await collector.scan()}
    except Exception as error:
        logger.exception("Bluetooth scan failed")
        raise HTTPException(status_code=503, detail="Bluetooth scan is unavailable") from error


@app.post("/v1/scales/pair")
async def pair_scale(candidate: ScaleCandidate) -> ScaleCandidate:
    try:
        return await collector.pair(candidate)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
