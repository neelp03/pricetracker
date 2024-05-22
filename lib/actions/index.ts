'use server';

import { revalidatePath } from "next/cache";
import Product from "../models/product.model";
import { connectToDB } from "../mongoose";
import { scrapeAmazonProduct } from "../scraper";
import { getAveragePrice, getHighestPrice, getLowestPrice } from "../utils";

export async function scrapeAndStoreProduct(productUrl: string) {
  if (!productUrl) return;

  try {
    await connectToDB();
    const scrapedProduct = await scrapeAmazonProduct(productUrl);

    if (!scrapedProduct) return;

    // Store the scraped product in the database
    let product = scrapedProduct;
    const existingProduct = await Product.findOne({ url: product.url });
    if (existingProduct) {
      const updatedPriceHistory:any = [...existingProduct.priceHistory, { price: scrapedProduct.currentPrice }];

      product = {
        ...scrapedProduct,
        priceHistory: updatedPriceHistory,
        lowestPrice: getLowestPrice(updatedPriceHistory),
        highestPrice: getHighestPrice(updatedPriceHistory),
        averagePrice: getAveragePrice(updatedPriceHistory)
      };
    }

    const newProduct = await Product.findOneAndUpdate(
      { url: scrapedProduct.url },
      product,
      { upsert: true, new: true }
    );

    revalidatePath(`products/${newProduct._id}`);
  } catch (error: any) {
    console.error("Error details:", error);
  }
}

export async function getProductById(productId: string) {
  try {
    connectToDB();
    const product = await Product.findOne({_id: productId});
    if(!product) return null;
    return product;
  } catch (error: any) {
    console.error("Error details:", error);
  }
}

export async function getAllProducts() {
  try {
    connectToDB();
    const products = await Product.find();
    if(!products) return [];
    return products;
  } catch (error: any) {
    console.error("Error details:", error);
  }
}