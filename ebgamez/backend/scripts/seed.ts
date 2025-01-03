import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import fs from "fs"; // If uploading from local files

const dynamodb = DynamoDBDocument.from(
  new DynamoDB({
    region: "us-west-2",
    credentials: fromIni({ profile: "observability2" }),
  })
);
const s3 = new S3Client({
  region: "us-west-2",
  credentials: fromIni({ profile: "observability2" }),
});

const tableName = "ebgamez-backend-Products";
const bucketName = "ebgamez-product-images";

// Add image URLs to each product in sampleProducts array
const sampleProducts = [
  {
    productId: "console-1",
    name: "PlayStation 5",
    price: 499.99,
    description: "Sony PS5 Console - Digital Edition",
    category: "console",
    stock: 25,
    fileName: "ps5-console.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/ps5-console.jpg",
  },
  {
    productId: "console-2",
    name: "Xbox Series X",
    price: 499.99,
    description: "Microsoft Xbox Series X Console",
    category: "console",
    stock: 30,
    fileName: "xbox-series-x.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/xbox-series-x.jpg",
  },
  {
    productId: "acc-1",
    name: "DualSense Controller",
    price: 69.99,
    description: "PS5 DualSense Wireless Controller",
    category: "accessory",
    stock: 100,
    fileName: "dualsense-controller.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/dualsense-controller.jpg",
  },
  {
    productId: "acc-2",
    name: "Xbox Wireless Controller",
    price: 59.99,
    description: "Xbox Series X|S Wireless Controller",
    category: "accessory",
    stock: 120,
    fileName: "xbox-controller.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/xbox-controller.jpg",
  },
  {
    productId: "game-ps5-1",
    name: "God of War Ragnarök",
    price: 69.99,
    description: "Action-adventure game for PS5",
    category: "game",
    platform: "PS5",
    stock: 200,
    fileName: "god-of-war-ragnarok.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/god-of-war-ragnarok.jpg",
  },
  {
    productId: "game-ps5-2",
    name: "Spider-Man 2",
    price: 69.99,
    description: "Marvel's Spider-Man 2 for PS5",
    category: "game",
    platform: "PS5",
    stock: 150,
    fileName: "spiderman-2.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/spiderman-2.jpg",
  },
  {
    productId: "game-xbox-1",
    name: "Halo Infinite",
    price: 59.99,
    description: "Sci-fi FPS for Xbox Series X|S",
    category: "game",
    platform: "Xbox",
    stock: 180,
    fileName: "halo-infinite.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/halo-infinite.jpg",
  },
  {
    productId: "game-ps5-3",
    name: "Final Fantasy VII Rebirth",
    price: 69.99,
    description: "Epic RPG adventure for PS5",
    category: "game",
    platform: "PS5",
    stock: 175,
    fileName: "final-fantasy-vii-rebirth.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/final-fantasy-vii-rebirth.jpg",
  },
  {
    productId: "game-ps5-4",
    name: "Horizon Forbidden West",
    price: 69.99,
    description: "Action RPG in a post-apocalyptic world",
    category: "game",
    platform: "PS5",
    stock: 160,
    fileName: "horizon-forbidden-west.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/horizon-forbidden-west.jpg",
  },
  {
    productId: "game-ps5-5",
    name: "Demon's Souls",
    price: 69.99,
    description: "Remake of the classic action RPG",
    category: "game",
    platform: "PS5",
    stock: 140,
    fileName: "demons-souls.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/demons-souls.jpg",
  },
  {
    productId: "game-xbox-3",
    name: "Starfield",
    price: 69.99,
    description: "Bethesda's epic space RPG",
    category: "game",
    platform: "Xbox",
    stock: 200,
    fileName: "starfield.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/starfield.jpg",
  },
  {
    productId: "game-xbox-5",
    name: "Flight Simulator",
    price: 59.99,
    description: "Ultra-realistic flight simulator",
    category: "game",
    platform: "Xbox",
    stock: 130,
    fileName: "flight-simulator.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/flight-simulator.jpg",
  },
  {
    productId: "game-ps5-6",
    name: "Ratchet & Clank: Rift Apart",
    price: 69.99,
    description: "Action platformer adventure",
    category: "game",
    platform: "PS5",
    stock: 145,
    fileName: "ratchet-and-clank.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/ratchet-and-clank.jpg",
  },
  {
    productId: "game-ps5-7",
    name: "Gran Turismo 7",
    price: 69.99,
    description: "Realistic racing simulator",
    category: "game",
    platform: "PS5",
    stock: 155,
    fileName: "gran-turismo-7.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/gran-turismo-7.jpg",
  },
  {
    productId: "game-xbox-7",
    name: "Cities Skylines II",
    price: 69.99,
    description: "City building simulator",
    category: "game",
    platform: "Xbox",
    stock: 170,
    fileName: "cities-skylines-ii.jpg",
    imageUrl:
      "https://ebgamez-product-images.s3.us-west-2.amazonaws.com/cities-skylines-ii.jpg",
  },
];

async function uploadImage(key: string, filePath: string) {
  try {
    const fileStream = fs.createReadStream(filePath); // Create a stream for the file

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fileStream,
      ContentType: "image/jpeg",
    };

    const command = new PutObjectCommand(uploadParams);
    const response = await s3.send(command);

    console.log("Image uploaded successfully:", response);
  } catch (error) {
    console.error("Error uploading image:", error);
  }
}

const populateProducts = async () => {
  try {
    console.log("Starting to populate gaming products...");

    for (const product of sampleProducts) {
      await dynamodb.put({
        TableName: tableName,
        Item: product,
      });

      // upload image to S3
      uploadImage(product.fileName, `./scripts/images/${product.fileName}`);

      console.log(`Added product: ${product.name}`);
    }

    console.log("Successfully populated all gaming products!");

    const { Items } = await dynamodb.scan({
      TableName: tableName,
    });

    console.log("\nCurrent products in database:");
    console.table(Items);
  } catch (error) {
    console.error("Error populating products:", error);
  }
};

// Run the script
populateProducts();
