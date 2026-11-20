import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Dawson & Dawson | KPI Portal", description: "Weekly accountability for Dawson and Dawson Home Care." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
