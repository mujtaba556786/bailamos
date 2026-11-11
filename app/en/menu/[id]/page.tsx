import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMenuContent } from "../../../../lib/menu-content.ts";
import { dishMetadata } from "../../../../lib/seo";
import { DishPage, relatedDishes } from "../../../../components/dish-page";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { content } = await getMenuContent(env.DB);
  const dish = content.dishes.find((item) => item.id === id);
  if (!dish) return { title: "Dish not found", robots: { index: false, follow: false } };
  return dishMetadata(dish, "en");
}

export default async function DishPageEn({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { content: menu } = await getMenuContent(env.DB);
  const dish = menu.dishes.find((item) => item.id === id);
  if (!dish) notFound();
  const category = menu.categories.find((item) => item.id === dish.categoryId);
  return <DishPage dish={dish} category={category} related={relatedDishes(menu, dish)} locale="en" />;
}
