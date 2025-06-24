import { useEffect, useState } from "react";

export function useErcomOrders() {
  const [orders, setOrders] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    fetch(
      "http://localhost:3000/frappe-api/api/method/ozerpan_ercom_sync.market.api.get_ercom_orders",
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setOrders(data?.message?.sales_orders || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoading(false);
      });
  }, []);

  return {
    orders,
    isLoading,
    isError,
  };
}
