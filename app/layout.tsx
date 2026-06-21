import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/Components/ui/sonner";
import { ThemeProvider } from "@/Components/theme-provider";
import { ApexRootLayout } from "@/Components/apex/ApexRootLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Dashboard — HotCol",
  description: "Apex Solution tenant management for HotCol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ApexRootLayout>{children}</ApexRootLayout>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "rounded-lg border border-border/60 shadow-lg backdrop-blur-sm",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
