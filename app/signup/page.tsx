import { AuthSheet } from "@/components/auth/auth-sheet";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { MarketingSections } from "@/components/marketing/sections";

export const metadata = { title: "Create account · The Design Factory" };

export default function SignUpPage() {
  return (
    <>
      <Hero />
      <MarketingSections />
      <Footer />
      <AuthSheet mode="signup" />
    </>
  );
}
