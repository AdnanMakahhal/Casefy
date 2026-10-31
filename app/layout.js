import { Geist, Geist_Mono } from "next/font/google";

import "./styles/globals.css";

import Header from "./components/Header";
import Navigation from "./components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    template: "Casefy - %s",
    default: "Casefy - Home",
  },
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header>
          <Navigation />
        </Header>

        {children}
      </body>
    </html>
  );
}
