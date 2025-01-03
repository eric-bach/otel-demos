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

const http = require('http');
const AWS = require('aws-sdk');
const axios = require('axios');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-grpc');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-grpc');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { AWSXRayPropagator } = require('@aws/otel-aws-xray-propagator');
const { Resource } = require('@opentelemetry/resources');
const { ResourceAttributes } = require('@opentelemetry/semantic-conventions');

// config
const create_cfg = require('./config');
const cfg = create_cfg.create_config('./config.yaml');

// tracer
const api = require('@opentelemetry/api');
const tracer = api.trace.getTracer('js-sample-app-tracer');
const common_span_attributes = { signal: 'trace', language: 'javascript' };

// Initialize the LoggerProvider
const loggerProvider = new LoggerProvider({
  resource: new Resource({
    'service.name': 'observability-demo',
  }),
});

// Configure the log exporter for a different CloudWatch log group
const logExporter = new OTLPLogExporter({
  url: 'http://adot-collector:4317', // Ensure this URL is correct and the ADOT collector is configured to send logs to CloudWatch
});

loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(logExporter));

// Get a logger instance
const logger = loggerProvider.getLogger('default-logger');

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://adot-collector:4317',
  }),
  metricExporter: new OTLPMetricExporter({
    url: 'http://adot-collector:4317',
  }),
  logExporter: logExporter, // Ensure the logExporter is added here
  textMapPropagator: new AWSXRayPropagator(),
  resource: new Resource({
    // [ResourceAttributes.SERVICE_NAME]: 'js-sample-app',
    'service.name': 'js-sample-app',
  }),
  instrumentations: [],
});

sdk.start();

// request metrics
const { updateTotalBytesSent, updateLatencyTime, updateApiRequestsMetric } = require('./request-metrics');

// start server for request metrics and traces
function startServer() {
  logger.emit({
    severityText: 'INFO',
    body: 'Starting server',
  });

  console.log('HHHHHHERE');

  const server = http.createServer(handleRequest);
  server.listen(cfg.Port, cfg.Host, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Node HTTP listening on ${cfg.Host}:${cfg.Port}`);
  });
}

async function handleRequest(req, res) {
  const requestStartTime = new Date().getMilliseconds();
  const routeMapper = {
    '/': (req, res) => {
      res.end('OK.');
    },
    '/aws-sdk-call': sdkCall,
    '/outgoing-http-call': outgoingHTTPCall,
    '/outgoing-sampleapp': outgoingSampleApp,
  };
  try {
    const handler = routeMapper[req.url];
    if (handler) {
      await handler(req, res);
      updateMetrics(res, req.url, requestStartTime);
    }
  } catch (err) {
    console.log(err);
  }
}

async function sdkCall(req, res) {
  const traceid = await instrumentRequest('aws-sdk-call', () => {
    const s3 = new AWS.S3();
    s3.listBuckets();
  });
  res.end(traceid);
}

async function outgoingHTTPCall(req, res) {
  const traceid = await instrumentRequest('outgoing-http-call', () => {
    httpCall('https://aws.amazon.com');
  });
  res.end(traceid);
}

async function outgoingSampleApp(req, res) {
  let traceid;
  if (cfg.SampleAppPorts.length > 0) {
    for (let i = 0; i < cfg.SampleAppPorts.length; i++) {
      let port = cfg.SampleAppPorts[i];
      let uri = `http://127.0.0.1:${port}/outgoing-sampleapp`;
      traceid = await instrumentRequest('/outgoing-sampleapp', () => {
        httpCall('https://aws.amazon.com');
      });
    }
  } else {
    traceid = await instrumentRequest('/outgoing-sampleapp', () => {
      httpCall('https://aws.amazon.com');
    });
  }
  res.end(traceid);
}

function updateMetrics(res, apiName, requestStartTime) {
  updateTotalBytesSent(res._contentLength + mimicPayLoadSize(), apiName, res.statusCode);
  updateLatencyTime(new Date().getMilliseconds() - requestStartTime, apiName, res.statusCode);
  updateApiRequestsMetric();
}

function getTraceIdJson() {
  const otelTraceId = api.trace.getSpan(api.context.active()).spanContext().traceId;
  const timestamp = otelTraceId.substring(0, 8);
  const randomNumber = otelTraceId.substring(8);
  const xrayTraceId = '1-' + timestamp + '-' + randomNumber;
  return JSON.stringify({ traceId: xrayTraceId });
}

function mimicPayLoadSize() {
  return Math.random() * 1000;
}

async function httpCall(url) {
  axios
    .get(url)
    .then((response) => {
      if (response.status != '200') {
        throw new Error(`Error! status: ${response.status}`);
      }
    })
    .catch((error) => {
      throw new Error(`Error while fetching the ${url}`, error);
    });
}

async function instrumentRequest(spanName, _callback) {
  const span = tracer.startSpan(spanName, {
    attributes: common_span_attributes,
  });
  const ctx = api.trace.setSpan(api.context.active(), span);
  let traceid;
  await api.context.with(ctx, async () => {
    console.log(`Responding to ${spanName}`);
    await _callback();
    traceid = getTraceIdJson();
    span.end();
  });
  return traceid;
}

module.exports = { startServer };
