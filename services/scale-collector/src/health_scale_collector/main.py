import asyncio
import logging
import os
from collections.abc import Callable
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Literal

import asyncpg
from bleak import BleakScanner
from etekcity_esf551_ble import (
    IMPEDANCE_KEY,
    WEIGHT_KEY,
    BluetoothScanningMode,
    ESF551Scale,
    ScaleData,
    WeightUnit,
    detect_model,
)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class ScaleCandidate(BaseModel):
    address: str
    name: str
    model: str


class DisplayUnitUpdate(BaseModel):
    display_unit: Literal["kg", "lb"]


class ScaleConnectionFailureHandler(logging.Handler):
    def __init__(self, recover: Callable[[], None]) -> None:
        super().__init__(level=logging.ERROR)
        self.recover = recover

    def emit(self, record: logging.LogRecord) -> None:
        if "Could not connect to scale" in record.getMessage():
            self.recover()


class Collector:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url
        self.pool: asyncpg.Pool | None = None
        self.scales: dict[str, ESF551Scale] = {}
        self.loop: asyncio.AbstractEventLoop | None = None
        self.recovery_tasks: dict[str, asyncio.Task[None]] = {}

    async def start(self) -> None:
        self.loop = asyncio.get_running_loop()
        self.pool = await asyncpg.create_pool(self.database_url)
        rows = await self.pool.fetch("SELECT bluetooth_address FROM scale_devices WHERE is_active")
        for row in rows:
            await self.start_collection(row["bluetooth_address"])

    async def stop(self) -> None:
        for task in self.recovery_tasks.values():
            task.cancel()
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
            ON CONFLICT (bluetooth_address) DO UPDATE SET
              name = EXCLUDED.name,
              model = EXCLUDED.model,
              is_active = true,
              last_seen_at = now()
            """,
            candidate.address,
            candidate.name,
            candidate.model,
        )
        await self.start_collection(candidate.address)
        return candidate

    async def paired_devices(self) -> list[ScaleCandidate]:
        assert self.pool
        rows = await self.pool.fetch(
            "SELECT bluetooth_address, name, model "
            "FROM scale_devices WHERE is_active ORDER BY paired_at"
        )
        return [
            ScaleCandidate(address=row["bluetooth_address"], name=row["name"], model=row["model"])
            for row in rows
        ]

    async def unpair(self, address: str) -> None:
        assert self.pool
        updated = await self.pool.execute(
            "UPDATE scale_devices SET is_active = false WHERE bluetooth_address = $1 AND is_active",
            address,
        )
        if updated == "UPDATE 0":
            raise ValueError("Scale is not paired")
        if scale := self.scales.pop(address, None):
            await scale.async_stop()

    def set_display_unit(self, address: str, display_unit: Literal["kg", "lb"]) -> None:
        scale = self.scales.get(address)
        if scale is None:
            raise ValueError("Paired scale is not being monitored")
        scale.display_unit = WeightUnit.KG if display_unit == "kg" else WeightUnit.LB

    async def start_collection(self, address: str) -> None:
        if address in self.scales:
            return

        def measurement_callback(data: ScaleData) -> None:
            asyncio.create_task(self.save_measurement(data))

        def schedule_recovery() -> None:
            if self.loop:
                self.loop.call_soon_threadsafe(self.start_recovery, address)

        assert self.pool
        display_unit = await self.pool.fetchval(
            "SELECT weight_display_unit FROM scale_devices WHERE bluetooth_address = $1", address
        )
        scale_logger = logging.getLogger(f"{__name__}.scale.{address}.{id(measurement_callback)}")
        scale_logger.addHandler(ScaleConnectionFailureHandler(schedule_recovery))
        scale = ESF551Scale(
            address,
            measurement_callback,
            WeightUnit.KG if display_unit == "kg" else WeightUnit.LB,
            scanning_mode=BluetoothScanningMode.PASSIVE,
            cooldown_seconds=5,
            logger=scale_logger,
        )
        self.scales[address] = scale
        await scale.async_start()

    def start_recovery(self, address: str) -> None:
        task = self.recovery_tasks.get(address)
        if task and not task.done():
            return
        self.recovery_tasks[address] = asyncio.create_task(self.recover_collection(address))

    async def recover_collection(self, address: str) -> None:
        logger.warning("Restarting BLE scanner after failed connection to %s", address)
        await asyncio.sleep(2)
        scale = self.scales.pop(address, None)
        if scale:
            try:
                await scale.async_stop()
            except Exception:
                logger.exception("Failed to stop stale scanner for %s", address)
        await asyncio.sleep(1)
        if self.pool and await self.pool.fetchval(
            "SELECT is_active FROM scale_devices WHERE bluetooth_address = $1", address
        ):
            try:
                await self.start_collection(address)
            except Exception:
                logger.exception("Failed to restart BLE scanner for %s", address)

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


@app.get("/v1/scales")
async def list_scales() -> dict[str, list[ScaleCandidate]]:
    return {"devices": await collector.paired_devices()}


@app.post("/v1/scales/scan")
async def scan_scales() -> dict[str, list[ScaleCandidate]]:
    if collector.scales:
        raise HTTPException(
            status_code=409,
            detail="A paired scale is already being monitored; scanning again is not needed.",
        )
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


@app.put("/v1/scales/{address}/display-unit")
async def set_display_unit(address: str, update: DisplayUnitUpdate) -> dict[str, str]:
    try:
        collector.set_display_unit(address, update.display_unit)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"display_unit": update.display_unit}


@app.delete("/v1/scales/{address}")
async def unpair_scale(address: str) -> dict[str, str]:
    try:
        await collector.unpair(address)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    return {"status": "unpaired"}
