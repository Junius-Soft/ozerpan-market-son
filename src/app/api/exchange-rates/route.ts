import { NextResponse } from "next/server";

const API_URL =
  "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json";

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

    if (!data.eur || !data.eur.try) {
      throw new Error("TRY rate not found in response");
    }

    const rate = data.eur.try;

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
    return NextResponse.json({ rate: 48.87, fallback: true });
  }
}
