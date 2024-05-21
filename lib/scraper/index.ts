import axios from "axios";
import * as cheerio from "cheerio";
import { extractCurrency, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  //BrightData proxy configuration
  const username = String(process.env.BRIGHTDATA_USERNAME);
  const password = String(process.env.BRIGHTDATA_PASSWORD);
  const port = 22225;
  const session_id = (Math.random() * 1000000) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password: password,
    },
    host: "brd.superproxy.io",
    port,
    rejectUnauthorized: false,
  };

  try {
    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".a-price-whole , .a-price-fraction"),
      $("a.size.base.a-color-price"),
      $(".priceToPay span.a-price-whole , .priceToPay span.a-price-fraction")
    );

    const originalPrice = extractPrice(
      $("#priceblock_ourprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price.a-text-strike")
    );

    const outOfStock = $("#availability span")
      .text()
      .toLowerCase()
      .includes("unavailable");

    const images =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrl = Object.keys(JSON.parse(images));

    const currency = extractCurrency($(".a-price-symbol"));
    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description: string[] = [];
    $("#feature-bullets ul li").each((_, el) => {
      description.push($(el).text().trim());
    });

    const category: string[] = [];
    $("#wayfinding-breadcrumbs_feature_div .a-link-normal").each((_, el) => {
      category.push($(el).text().trim());
    });

    const reviewsCount = $("#acrCustomerReviewText").text().split(" ")[0];
    // only get the first 3 characters of the stars
    const stars = $("#acrPopover").attr("title");

    const data = {
      url,
      currency: currency || "$",
      image: imageUrl[0],
      title,
      currentPrice: Number(currentPrice),
      originalPrice: Number(originalPrice),
      priceHistory: [],
      discountRate: Number(discountRate),
      category: category,
      reviewsCount: Number(reviewsCount),
      stars: String(stars).substring(0, 3),
      isOutofStock: outOfStock,
      description,
    };
  } catch (error: any) {
    throw new Error(`failed to scrape product: ${error.message}`);
  }
}