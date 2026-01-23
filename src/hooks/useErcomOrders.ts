import { useFrappePostCall } from "frappe-react-sdk";
import { useEffect, useState } from "react";

export function useErcomOrders() {
  const [orders, setOrders] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { call } = useFrappePostCall(
    "ozerpan_ercom_sync.market.api.get_ercom_orders"
  );
  useEffect(() => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);
    
    call({})
      .then((data) => {
        setOrders(data?.message?.sales_orders || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn("useErcomOrders: Failed to fetch orders:", error);
        // Hata durumunda boş liste döndür, sayfa yüklenmesini engelleme
        setOrders([]);
        setIsError(true);
        setIsLoading(false);
        setErrorMessage(
          error instanceof Error 
            ? error.message 
            : "Siparişler yüklenemedi. Yetkilendirme hatası olabilir."
        );
      });
  }, [call]);

  return {
    orders,
    isLoading,
    isError,
    errorMessage,
  };
}
