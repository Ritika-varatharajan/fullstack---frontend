import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoreCraft - Student Performance and Management System",
  description: "Modern Student Performance Assessment, Delivery, Auto-grading & Management System by ScoreCraft",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
