import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Fulfillment } from '../types';
import { createResponse } from '../utils/response';

const dynamodb = DynamoDBDocument.from(new DynamoDB());
const tableName = process.env.FULFILLMENTS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (!pathParameters?.fulfillmentId) {
          return createResponse(400, { message: 'Missing fulfillmentId' });
        }
        // Get fulfillment
        const { Item } = await dynamodb.get({
          TableName: tableName,
          Key: { fulfillmentId: pathParameters.fulfillmentId }
        });
        return createResponse(200, Item);

      case 'POST':
        if (!body) {
          return createResponse(400, { message: 'Missing request body' });
        }
        // Create fulfillment
        const fulfillmentData = JSON.parse(body);
        const fulfillment: Fulfillment = {
          fulfillmentId: Date.now().toString(),
          orderId: fulfillmentData.orderId,
          status: 'pending',
          updatedAt: new Date().toISOString()
        };
        
        await dynamodb.put({
          TableName: tableName,
          Item: fulfillment
        });
        return createResponse(201, fulfillment);

      case 'PUT':
        if (!body || !pathParameters?.fulfillmentId) {
          return createResponse(400, { message: 'Missing required parameters' });
        }
        // Update fulfillment status
        const updateData: Partial<Fulfillment> = JSON.parse(body);
        await dynamodb.update({
          TableName: tableName,
          Key: { fulfillmentId: pathParameters.fulfillmentId },
          UpdateExpression: 'set #status = :status, trackingNumber = :trackingNumber, updatedAt = :updatedAt',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': updateData.status,
            ':trackingNumber': updateData.trackingNumber,
            ':updatedAt': new Date().toISOString()
          }
        });
        return createResponse(200, { ...updateData, fulfillmentId: pathParameters.fulfillmentId });

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, { message: 'Internal server error' });
  }
};
