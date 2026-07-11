import { AuthSheet } from "@/components/auth/auth-sheet";
import { demoFeaturesEnabled } from "@/lib/env";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { MarketingSections } from "@/components/marketing/sections";

export const metadata = { title: "Sign in · The Design Factory" };

export default function SignInPage() {
  const showDemo = demoFeaturesEnabled();
  return (
    <>
      <Hero />
      <MarketingSections />
      <Footer />
      <AuthSheet mode="login" showDemo={showDemo} />
    </>
  );
}
