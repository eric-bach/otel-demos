/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS'" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 *
 */

'use strict';

import http, { IncomingMessage, ServerResponse } from 'http';
import AWS from 'aws-sdk';
import axios from 'axios';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { AWSXRayPropagator } from '@aws/otel-aws-xray-propagator';
import { Resource } from '@opentelemetry/resources';
import { create_config } from './config';
import { updateTotalBytesSent, updateLatencyTime, updateApiRequestsMetric } from './request-metrics';
import { trace, context } from '@opentelemetry/api';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// config
const cfg = create_config('./config.yaml');

// tracer
const tracer = trace.getTracer('sample-app-tracer');
const common_span_attributes = { signal: 'trace', language: 'javascript' };

// logger
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    // TODO - replace with ResourceAttributes.SERVICE_NAME
    'service.name': 'sample-app-logger',
  }),
});
const logRecordProcessor = new SimpleLogRecordProcessor(
  new OTLPLogExporter({
    url: 'http://adot-collector:4317', // Ensure this URL is correct and the ADOT collector is configured to send logs to CloudWatch
  })
);
loggerProvider.addLogRecordProcessor(logRecordProcessor);
const logger = loggerProvider.getLogger('default-logger');

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://adot-collector:4317',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: 'http://adot-collector:4317',
      headers: {},
    }),
    exportIntervalMillis: 1000,
  }),
  logRecordProcessors: [logRecordProcessor],
  textMapPropagator: new AWSXRayPropagator(),
  resource: new Resource({
    // TODO - replace with ResourceAttributes.SERVICE_NAME
    'service.name': 'js-sample-app',
  }),
  instrumentations: [],
});

sdk.start();

// start server for request metrics and traces
function startServer(): void {
  logger.emit({
    severityText: 'INFO',
    body: 'Starting server',
  });

  console.log('HHHHHEEEEEEEEEEEEEERRRRRRRRRRRRRREEEEEEEEE');

  const server = http.createServer(handleRequest);
  server.listen(cfg.Port, cfg.Host, (err?: Error) => {
    if (err) {
      throw err;
    }
    console.log(`Node HTTP listening on ${cfg.Host}:${cfg.Port}`);
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestStartTime = new Date().getMilliseconds();
  const routeMapper: { [key: string]: (req: IncomingMessage, res: ServerResponse) => Promise<void> } = {
    '/': async (req, res) => {
      res.end('OK.');
    },
    '/aws-sdk-call': sdkCall,
    '/outgoing-http-call': outgoingHTTPCall,
    '/outgoing-sampleapp': outgoingSampleApp,
  };
  try {
    const handler = routeMapper[req.url!];
    if (handler) {
      await handler(req, res);
      updateMetrics(res, req.url!, requestStartTime);
    }
  } catch (err) {
    console.log(err);
  }
}

async function sdkCall(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const traceid = await instrumentRequest('aws-sdk-call', () => {
    const s3 = new AWS.S3();
    s3.listBuckets();
  });
  res.end(traceid);
}

async function outgoingHTTPCall(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const traceid = await instrumentRequest('outgoing-http-call', () => {
    httpCall('https://aws.amazon.com');
  });
  res.end(traceid);
}

async function outgoingSampleApp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let traceid;
  if (cfg.SampleAppPorts.length > 0) {
    for (let i = 0; i < cfg.SampleAppPorts.length; i++) {
      const port = cfg.SampleAppPorts[i];
      const uri = `http://127.0.0.1:${port}/outgoing-sampleapp`;
      traceid = await instrumentRequest('/outgoing-sampleapp', () => {
        httpCall(uri);
      });
    }
  } else {
    traceid = await instrumentRequest('/outgoing-sampleapp', () => {
      httpCall('https://aws.amazon.com');
    });
  }
  res.end(traceid);
}

function updateMetrics(res: ServerResponse, apiName: string, requestStartTime: number): void {
  updateTotalBytesSent((res.getHeader('content-length') as number) + mimicPayLoadSize(), apiName, res.statusCode!);
  updateLatencyTime(new Date().getMilliseconds() - requestStartTime, apiName, res.statusCode!);
  updateApiRequestsMetric();
}

function getTraceIdJson(): string {
  const otelTraceId = trace.getSpan(context.active())?.spanContext().traceId;
  const timestamp = otelTraceId?.substring(0, 8);
  const randomNumber = otelTraceId?.substring(8);
  const xrayTraceId = '1-' + timestamp + '-' + randomNumber;
  return JSON.stringify({ traceId: xrayTraceId });
}

function mimicPayLoadSize(): number {
  return Math.random() * 1000;
}

async function httpCall(url: string): Promise<void> {
  try {
    const response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`Error! status: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Error while fetching the ${url}: ${error}`);
  }
}

async function instrumentRequest(spanName: string, _callback: () => void): Promise<string> {
  const span = tracer.startSpan(spanName, {
    attributes: common_span_attributes,
  });
  const ctx = trace.setSpan(context.active(), span);
  let traceid: string;
  await context.with(ctx, async () => {
    console.log(`Responding to ${spanName}`);
    await _callback();
    traceid = getTraceIdJson();
    span.end();
  });
  return traceid!;
}

export { startServer };
