/**
 * OpenTelemetry tracing init — must be imported before any other module.
 *
 * Reads standard OTEL env vars:
 *   OTEL_EXPORTER_OTLP_ENDPOINT
 *   OTEL_EXPORTER_OTLP_HEADERS
 *   OTEL_EXPORTER_OTLP_PROTOCOL
 *   OTEL_SERVICE_NAME
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'afenda-api',
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();

  const shutdown = () => sdk.shutdown().catch(console.error);
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
