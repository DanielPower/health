import pg from 'pg';
import { env } from '$env/dynamic/private';

const { Pool } = pg;

export const database = new Pool({ connectionString: env.DATABASE_URL });
