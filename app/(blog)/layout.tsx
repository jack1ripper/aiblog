import { Header } from "@/components/header";
import { SiteFooter } from "@/components/site-footer";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
