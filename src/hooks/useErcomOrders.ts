import { useEffect, useState } from "react";

export function useErcomOrders() {
  const [orders, setOrders] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    fetch(
      "https://erp.ozerpan.com.tr:8001/api/method/ozerpan_ercom_sync.market.api.get_ercom_orders"
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
