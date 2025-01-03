import { APIGatewayProxyResult } from 'aws-lambda';
import { ApplicationError } from '../types/errors';

export const createResponse = (statusCode: number, body: any): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
});

export const handleError = (error: unknown): APIGatewayProxyResult => {
  console.error(error);
  
  if (error instanceof ApplicationError) {
    return createResponse(error.statusCode, { message: error.message });
  }
  
  return createResponse(500, { message: 'Internal server error' });
};
