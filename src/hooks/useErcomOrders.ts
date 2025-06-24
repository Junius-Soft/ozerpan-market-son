import { useFrappePostCall } from "frappe-react-sdk";
import { useEffect, useState } from "react";

export function useErcomOrders() {
  const [orders, setOrders] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const { call } = useFrappePostCall(
    "ozerpan_ercom_sync.market.api.get_ercom_orders"
  );
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    call({})
      .then((data) => {
        setOrders(data?.message?.sales_orders || []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsError(true);
        setIsLoading(false);
      });
  }, [call]);

  return {
    orders,
    isLoading,
    isError,
  };
}
