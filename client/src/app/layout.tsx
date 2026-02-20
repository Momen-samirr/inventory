import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import DashboardWrapper from "./dashboardWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "Production-ready inventory management system with authentication and RBAC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <DashboardWrapper>
            {children}
            <Toaster position="top-right" />
          </DashboardWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
