import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recon | Vulnerability Scanner",
  description: "Silent intelligence. Active defense.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="bg-recon-bgPrimary text-recon-textPrimary overflow-x-hidden min-h-screen"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}