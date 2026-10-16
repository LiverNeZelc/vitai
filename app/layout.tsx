import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Кварта — свежая обжарка кофе",
  description: "Лендинг обжарки кофе Кварта: свежие зерна, подписка, доставка по Минску и форма заявки.",
  openGraph: {
    title: "Кварта — свежая обжарка кофе",
    description: "Небольшая кофейная мастерская в Минске. Обжариваем маленькими партиями с 2019 года.",
    locale: "ru_BY",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
