import { useState, useEffect } from "react";

interface ExchangeRateResponse {
  rate: number;
  cached?: boolean;
  fallback?: boolean;
}

export const useExchangeRate = () => {
  const [eurRate, setEurRate] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch("/api/exchange-rates");
        if (!response.ok) {
          throw new Error("Failed to fetch exchange rate");
        }
        const data: ExchangeRateResponse = await response.json();
        setEurRate(data.rate);
        setLoading(false);

        if (data.fallback) {
          setError("Using fallback exchange rate");
        } else if (data.cached) {
          console.info("Using cached exchange rate");
        }
      } catch (err) {
        console.error("Error fetching exchange rate:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch exchange rate"
        );
        setLoading(false);
        setEurRate(44); // Varsayılan EUR/TL kuru
      }
    };

    fetchExchangeRate();

    // Her 5 dakikada bir güncelle
    const interval = setInterval(fetchExchangeRate, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
  return { eurRate, loading, error };
};
