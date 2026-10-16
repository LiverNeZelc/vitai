import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Кварта — свежая обжарка кофе",
  description: "Лендинг обжарки кофе Кварта: свежие зерна, подписка, доставка по Минску и форма заявки.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
