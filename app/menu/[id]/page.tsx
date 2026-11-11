import { env } from "cloudflare:workers";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { getMenuContent } from "../../../lib/menu-content.ts";
import { dishMetadata, dishPath } from "../../../lib/seo";
import { DishPage, relatedDishes } from "../../../components/dish-page";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { content } = await getMenuContent(env.DB);
  const dish = content.dishes.find((item) => item.id === id);
  if (!dish) return { title: "Gericht nicht gefunden", robots: { index: false, follow: false } };
  return dishMetadata(dish, "de");
}

// German dish page. English dishes live at /en/menu/[id]; ?lang=en is redirected there so there is one URL per language.
export default async function DishPageDe({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const { content: menu } = await getMenuContent(env.DB);
  const dish = menu.dishes.find((item) => item.id === id);
  if (!dish) notFound();
  if (query.lang === "en") permanentRedirect(dishPath(dish.id, "en"));
  const category = menu.categories.find((item) => item.id === dish.categoryId);
  return <DishPage dish={dish} category={category} related={relatedDishes(menu, dish)} locale="de" />;
}
