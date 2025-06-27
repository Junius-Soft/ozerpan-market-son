"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { type Product, getProducts } from "@/documents/products";
import { useAuth } from "@/hooks/useAuth";
import { LoginModal } from "@/components/login-modal";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {
    isAuthenticated,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
    handleLoginSuccess,
  } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const { products } = await getProducts();
        setProducts(products);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleTeklifClick = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      e.preventDefault();
      openLoginModal();
    }
  };

  if (isLoading) {
    return (
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border p-6">
                <Skeleton className="aspect-video w-full rounded-lg mb-4" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-48 mt-2" />
                <Skeleton className="h-4 w-full mt-4" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-8">Ürünlerimiz</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className={`${!product.isActive ? "opacity-50" : ""}`}
              >
                <div className="aspect-video relative">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    priority
                  />
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>
                    {product.id === "panjur"
                      ? "Yüksek kaliteli panjur sistemleri"
                      : product.id === "pencere"
                      ? "Modern pencere çözümleri"
                      : product.id === "sineklik"
                      ? "Etkili sineklik sistemleri"
                      : "Kaliteli kapı sistemleri"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {product.id === "panjur"
                      ? "Modern ve dayanıklı panjur sistemleri ile evinizi güzelleştirin."
                      : product.id === "pencere"
                      ? "Enerji tasarruflu ve estetik pencere sistemleri."
                      : product.id === "sineklik"
                      ? "Zararlıları dışarıda tutarken temiz hava alın."
                      : "Güvenli ve şık kapı sistemleri."}
                  </p>
                  {!product.isActive && (
                    <div className="mt-4">
                      <span className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-800">
                        Yakında
                      </span>
                    </div>
                  )}
                  {product.isActive && (
                    <div className="mt-4">
                      <Link
                        href="/offers"
                        className="w-full block"
                        onClick={handleTeklifClick}
                      >
                        <Button className="w-full">Teklif Al</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <LoginModal
        isOpen={showLoginModal}
        onClose={closeLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </>
  );
}
