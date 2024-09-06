import pretty from "pino-pretty";
import pino from "pino";

let dotenv: any = null;
try {
    dotenv = await import ('dotenv')
} catch (e) {
}

const stream = pretty({
    colorize: true
})

dotenv?.config();

export const logger = pino({
    name: 'InfluxDB Sparkplug Ingester',
    level: process.env.LOG_LEVEL || 'info',
}, stream);