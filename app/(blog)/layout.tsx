import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { SiteBanners } from "@/components/site-banners";
import { getActiveBanners } from "@/lib/announcements";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const banners = await getActiveBanners();

  return (
    <>
      <Header />
      <SiteBanners banners={banners} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
