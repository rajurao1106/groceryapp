import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { OrdersDemoProvider } from "@/components/orders-demo-provider";
import { ProductCatalogProvider } from "@/components/product-catalog-provider";
import { DeliveryPartnersDemoProvider } from "@/components/delivery-partners-demo-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Greenmart Admin Dashboard",
  description: "A preview of the Greenmart grocery operations dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ProductCatalogProvider>
          <DeliveryPartnersDemoProvider>
            <OrdersDemoProvider>{children}</OrdersDemoProvider>
          </DeliveryPartnersDemoProvider>
        </ProductCatalogProvider>
      </body>
    </html>
  );
}
