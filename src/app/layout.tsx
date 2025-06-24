import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { AuthGuard } from "@/components/auth-guard";
import { ToastProvider } from "@/contexts/toast-context";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ClientFrappeProvider } from "@/components/frappe-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Özerpan Market",
  description: "Panjur, Pencere ve Kapı Sistemleri",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background font-sans antialiased`}
        suppressHydrationWarning
      >
        <ClientFrappeProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="ozerpan-theme"
          >
            <ToastProvider>
              <Navbar />
              <AuthGuard>{children}</AuthGuard>
              <ToastContainer />
            </ToastProvider>
          </ThemeProvider>
        </ClientFrappeProvider>
      </body>
    </html>
  );
}
