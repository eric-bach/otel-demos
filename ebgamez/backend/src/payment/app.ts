import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Payment } from '../types';
import { createResponse } from '../utils/response';

const dynamodb = DynamoDBDocument.from(new DynamoDB());
const tableName = process.env.PAYMENTS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (!pathParameters?.paymentId) {
          return createResponse(400, { message: 'Missing paymentId' });
        }
        // Get payment
        const { Item } = await dynamodb.get({
          TableName: tableName,
          Key: { paymentId: pathParameters.paymentId }
        });
        return createResponse(200, Item);

      case 'POST':
        if (!body) {
          return createResponse(400, { message: 'Missing request body' });
        }
        // Process payment
        const paymentData = JSON.parse(body);
        const payment: Payment = {
          paymentId: Date.now().toString(),
          invoiceId: paymentData.invoiceId,
          amount: paymentData.amount,
          status: 'success', // In real world, this would depend on payment processing
          createdAt: new Date().toISOString()
        };
        
        await dynamodb.put({
          TableName: tableName,
          Item: payment
        });
        return createResponse(201, payment);

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, { message: 'Internal server error' });
  }
};
