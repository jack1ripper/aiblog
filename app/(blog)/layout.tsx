import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";
import { SiteBanners } from "@/components/site-banners";
import { getActiveBanners } from "@/lib/announcements";
import { PageViewTracker } from "@/components/pageview-tracker";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const banners = await getActiveBanners();

  return (
    <>
      <PageViewTracker />
      <Header />
      <SiteBanners banners={banners} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
      <SiteFooter />
    </>
  );
}
