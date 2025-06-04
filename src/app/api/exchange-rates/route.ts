import { NextResponse } from "next/server";

const EXCHANGE_RATES_API_KEY = process.env.EXCHANGE_RATES_API_KEY;
const API_URL = `http://api.exchangeratesapi.io/v1/latest?access_key=${EXCHANGE_RATES_API_KEY}&symbols=TRY`;

// Cache the exchange rate for 1 hour
let cachedData: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET() {
  try {
    // Check if we have cached data that's still valid
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return NextResponse.json({ rate: cachedData.rate });
    }

    // Fetch new data if cache is invalid or doesn't exist
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rate");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }

    const rate = data.rates.TRY;

    // Update cache
    cachedData = {
      rate,
      timestamp: Date.now(),
    };

    return NextResponse.json({ rate });
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Return last known rate if available, otherwise fallback rate
    if (cachedData) {
      return NextResponse.json({ rate: cachedData.rate, cached: true });
    }
    return NextResponse.json({ rate: 44.88, fallback: true });
  }
}
