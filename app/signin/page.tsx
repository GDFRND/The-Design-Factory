import { AuthSheet } from "@/components/auth/auth-sheet";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { MarketingSections } from "@/components/marketing/sections";

export const metadata = { title: "Sign in · The Design Factory" };

export default function SignInPage() {
  return (
    <>
      <Hero />
      <MarketingSections />
      <Footer />
      <AuthSheet mode="login" />
    </>
  );
}
