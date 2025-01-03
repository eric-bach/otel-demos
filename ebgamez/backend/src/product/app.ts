import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { Product } from '../types';
import { createResponse } from '../utils/response';

const dynamodb = DynamoDBDocument.from(new DynamoDB());
const tableName = process.env.PRODUCTS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.productId) {
          // Get single product
          const { Item } = await dynamodb.get({
            TableName: tableName,
            Key: { productId: pathParameters.productId }
          });
          return createResponse(200, Item);
        } else {
          // List all products
          const { Items } = await dynamodb.scan({ TableName: tableName });
          return createResponse(200, Items);
        }

      case 'POST':
        if (!body) {
          return createResponse(400, { message: 'Missing request body' });
        }
        // Create product
        const newProduct: Product = {
          ...JSON.parse(body),
          productId: Date.now().toString()
        };
        await dynamodb.put({
          TableName: tableName,
          Item: newProduct
        });
        return createResponse(201, newProduct);

      case 'PUT':
        if (!body || !pathParameters?.productId) {
          return createResponse(400, { message: 'Missing required parameters' });
        }
        // Update product
        const updateProduct: Partial<Product> = JSON.parse(body);
        const updateExpression = Object.keys(updateProduct)
          .filter(key => key !== 'productId')
          .map(key => `#${key} = :${key}`)
          .join(', ');

        const expressionAttributeNames = Object.keys(updateProduct)
          .filter(key => key !== 'productId')
          .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});

        const expressionAttributeValues = Object.entries(updateProduct)
          .filter(([key]) => key !== 'productId')
          .reduce((acc, [key, value]) => ({ ...acc, [`:${key}`]: value }), {});

        await dynamodb.update({
          TableName: tableName,
          Key: { productId: pathParameters.productId },
          UpdateExpression: `set ${updateExpression}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues
        });
        return createResponse(200, { ...updateProduct, productId: pathParameters.productId });

      case 'DELETE':
        if (!pathParameters?.productId) {
          return createResponse(400, { message: 'Missing productId' });
        }
        // Delete product
        await dynamodb.delete({
          TableName: tableName,
          Key: { productId: pathParameters.productId }
        });
        return createResponse(204, null);

      default:
        return createResponse(400, { message: 'Unsupported method' });
    }
  } catch (error) {
    console.error(error);
    return createResponse(500, { message: 'Internal server error' });
  }
};
