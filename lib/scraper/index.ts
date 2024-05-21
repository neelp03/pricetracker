import axios from "axios";
import * as cheerio from "cheerio";
import { extractPrice } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if(!url) return;

  //BrightData proxy configuration
  const username = String(process.env.BRIGHTDATA_USERNAME);
  const password = String(process.env.BRIGHTDATA_PASSWORD);
  const port = 22225;
  const session_id = (Math.random() * 1000000) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password: password
    },
    host: 'brd.superproxy.io',
    port,
    rejectUnauthorized: false
  }

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $('.a-price-whole , .a-price-fraction'),
    );

    const originalPrice = extractPrice(
      $('#priceblock_ourprice'),
      $('.a-price.a-text-price span.a-offscreen'),
      $('#listPrice'),
      $('#priceblock_dealprice'),
      $('.a-size-base.a-color-price.a-text-strike')
    );
    console.log({ title, currentPrice })
  } catch (error: any) {
    throw new Error(`failed to scrape product: ${error.message}`);
  }
}