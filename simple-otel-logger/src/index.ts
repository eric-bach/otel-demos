import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import {
  LoggerProvider,
  SimpleLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { NodeTracerProvider } from '@opentelemetry/node';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { SpanProcessor } from '@opentelemetry/tracing';

// Initialize the LoggerProvider
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'observability-demo',
  }),
});

// Configure OTLP exporter
const logExporter = new OTLPLogExporter({
  url: 'http://adot-collector:4317',
});

loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// Get a logger instance
const logger = loggerProvider.getLogger('default-logger');

function printMessage(): void {
  logger.emit({
    severityText: 'INFO',
    body: 'Hello from Docker container!',
  });
}

// Print immediately on start
printMessage();

// Then print every 60 seconds
setInterval(printMessage, 60000);

// Proper shutdown
process.on('SIGINT', () => {
  console.log('Stopping container...');
  loggerProvider
    .shutdown()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error shutting down logger', error);
      process.exit(1);
    });
});
