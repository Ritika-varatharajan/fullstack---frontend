import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quill - Modern Assessment & Evaluation Portal",
  description: "Modern Assessment Creation, Delivery, Auto-grading & Analytics Platform by Quill",
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
