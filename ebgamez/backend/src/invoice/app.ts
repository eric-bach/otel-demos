import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Invoice } from '../types';
import { createResponse } from '../utils/response';

const dynamodb = DynamoDBDocument.from(new DynamoDB());
const tableName = process.env.INVOICES_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (!pathParameters?.invoiceId) {
          return createResponse(400, { message: 'Missing invoiceId' });
        }
        // Get invoice
        const { Item } = await dynamodb.get({
          TableName: tableName,
          Key: { invoiceId: pathParameters.invoiceId }
        });
        return createResponse(200, Item);

      case 'POST':
        if (!body) {
          return createResponse(400, { message: 'Missing request body' });
        }
        // Create invoice
        const newInvoice: Invoice = {
          ...JSON.parse(body),
          invoiceId: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        await dynamodb.put({
          TableName: tableName,
          Item: newInvoice
        });
        return createResponse(201, newInvoice);

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, { message: 'Internal server error' });
  }
};
