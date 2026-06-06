import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Dental PatientFlow AI",
    template: "%s | Dental PatientFlow AI",
  },
  description:
    "Convert more dental implant enquiries into booked consultations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
