import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Order } from '../types';
import { createResponse } from '../utils/response';

const dynamodb = DynamoDBDocument.from(new DynamoDB());
const tableName = process.env.ORDERS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (!pathParameters?.orderId) {
          return createResponse(400, { message: 'Missing orderId' });
        }
        // Get order
        const { Item } = await dynamodb.get({
          TableName: tableName,
          Key: { orderId: pathParameters.orderId }
        });
        return createResponse(200, Item);

      case 'POST':
        if (!body) {
          return createResponse(400, { message: 'Missing request body' });
        }
        // Create order
        const newOrder: Order = {
          ...JSON.parse(body),
          orderId: Date.now().toString(),
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        await dynamodb.put({
          TableName: tableName,
          Item: newOrder
        });
        return createResponse(201, newOrder);

      case 'PUT':
        if (!body || !pathParameters?.orderId) {
          return createResponse(400, { message: 'Missing required parameters' });
        }
        // Update order
        const updateOrder: Partial<Order> = JSON.parse(body);
        const updateExpression = Object.keys(updateOrder)
          .filter(key => key !== 'orderId')
          .map(key => `#${key} = :${key}`)
          .join(', ');

        const expressionAttributeNames = Object.keys(updateOrder)
          .filter(key => key !== 'orderId')
          .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});

        const expressionAttributeValues = Object.entries(updateOrder)
          .filter(([key]) => key !== 'orderId')
          .reduce((acc, [key, value]) => ({ ...acc, [`:${key}`]: value }), {});

        await dynamodb.update({
          TableName: tableName,
          Key: { orderId: pathParameters.orderId },
          UpdateExpression: `set ${updateExpression}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues
        });
        return createResponse(200, { ...updateOrder, orderId: pathParameters.orderId });

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, { message: 'Internal server error' });
  }
};
