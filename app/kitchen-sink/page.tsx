import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { InstitutionalLockup } from "@/components/brand/institutional-lockup";
import { MonoLabel } from "@/components/brand/mono-label";
import { PartnerStrip } from "@/components/brand/partner-strip";
import { SpecPlate } from "@/components/brand/spec-plate";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { HeroCycle } from "@/components/motion/hero-cycle";
import { ThemeToggle } from "@/components/theme-toggle";

const ramp = [
  "000", "025", "050", "100", "200", "300", "400",
  "500", "600", "700", "800", "900", "950",
] as const;

const rampClasses: Record<(typeof ramp)[number], string> = {
  "000": "bg-tdf-000", "025": "bg-tdf-025", "050": "bg-tdf-050",
  "100": "bg-tdf-100", "200": "bg-tdf-200", "300": "bg-tdf-300",
  "400": "bg-tdf-400", "500": "bg-tdf-500", "600": "bg-tdf-600",
  "700": "bg-tdf-700", "800": "bg-tdf-800", "900": "bg-tdf-900",
  "950": "bg-tdf-950",
};

export const metadata = { title: "Kitchen sink · The Design Factory" };

export default function KitchenSink() {
  return (
    <main className="container-tdf flex flex-col gap-16 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-h1">Kitchen sink</h1>
        <ThemeToggle />
      </div>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§00" name="Colour" note="13-step graphite ramp · blueprint accent" />
        <div className="flex flex-wrap gap-1">
          {ramp.map((step) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className={`size-12 rounded-chip border border-line ${rampClasses[step]}`} />
              <MonoLabel size="xs" className="text-muted-foreground">{step}</MonoLabel>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            ["50", "bg-accent-50"], ["100", "bg-accent-100"], ["300", "bg-accent-300"],
            ["400", "bg-accent-400"], ["500", "bg-accent-500"], ["600", "bg-accent-600"],
            ["700", "bg-accent-700"],
          ].map(([step, cls]) => (
            <div key={step} className="flex flex-col items-center gap-1">
              <div className={`size-12 rounded-chip ${cls}`} />
              <MonoLabel size="xs" className="text-muted-foreground">{step}</MonoLabel>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <div className="size-12 rounded-chip bg-success" />
            <MonoLabel size="xs" className="text-muted-foreground">OK</MonoLabel>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="size-12 rounded-chip bg-warning" />
            <MonoLabel size="xs" className="text-muted-foreground">WARN</MonoLabel>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="size-12 rounded-chip bg-danger" />
            <MonoLabel size="xs" className="text-muted-foreground">ERR</MonoLabel>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§01" name="Type" note="Newsreader · Inter · JetBrains Mono" />
        <p className="text-display-1">Display one</p>
        <p className="text-display-2">Display two</p>
        <p className="text-display-italic">One italic phrase per page</p>
        <p className="text-h1">Heading one · Inter 600</p>
        <p className="text-h2">Heading two · Inter 600</p>
        <p className="text-body max-w-[68ch]">
          Body: Inter 400 at 17px, 1.65 line height. The measure never
          exceeds sixty-eight characters, which is where this paragraph
          politely stops growing.
        </p>
        <p className="text-caption text-muted-foreground">Caption · Inter 400 · 12/1.5</p>
        <MonoLabel>Mono label · 12 · 0.12em</MonoLabel>
      </section>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§02" name="Controls" note="Pill buttons · radius-4 inputs" />
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="accent">The one accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
        <div className="grid max-w-md gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ks-name">Hotel name</Label>
            <Input id="ks-name" placeholder="Rhino Fort Hotel" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ks-type">Asset type</Label>
            <Select>
              <SelectTrigger id="ks-type">
                <SelectValue placeholder="Choose an asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poster">Poster</SelectItem>
                <SelectItem value="social">Social media post</SelectItem>
                <SelectItem value="email">Email sales letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ks-brief">Brief</Label>
            <Textarea id="ks-brief" placeholder="Describe the offer…" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="mono">Pending · Awaiting Amina</Badge>
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Changes requested</Badge>
          <Badge variant="danger">Failed</Badge>
        </div>
        <div className="flex gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Right-hand sheet</SheetTitle>
                <SheetDescription>
                  min(440px, 100vw) · radius 12 0 0 12 · elevation 4 ·
                  graphite scrim with 2px blur.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog</DialogTitle>
                <DialogDescription>Radius 12 · elevation 4.</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§03" name="Cards" note="Radius 8 · elevation 1" />
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Weekend buffet</CardTitle>
            <CardDescription>Restaurant promotion · IG feed · 1080×1350</CardDescription>
          </CardHeader>
          <CardContent className="text-body text-secondary-foreground">
            Family buffet every Saturday and Sunday, KES 2,500 per adult,
            children under twelve half price.
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§04" name="Brand lockups" note="TF at 1.4× cap height · clear space x = ¼ mark" />
        <div className="rounded-panel border border-line bg-raised p-6">
          <InstitutionalLockup variant="positive" />
        </div>
        <div className="rounded-panel bg-tdf-950 p-6">
          <InstitutionalLockup variant="reversed" />
        </div>
        <div className="flex flex-col items-center gap-8 rounded-panel bg-tdf-950 p-8">
          <InstitutionalLockup variant="reversed" wordmark markSize={48} />
          <Separator className="bg-tdf-800" />
          <PartnerStrip />
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SpecPlate no="§05" name="Motion" note="120 / 180 / 260 / 420ms · cubic-bezier(.2,.6,.2,1)" />
        <AnimatedHeading
          text={"The Design Factory"}
          accent="Factory"
          accentClassName="italic text-blueprint"
          as="p"
          className="text-display-2 font-display"
        />
        <FadeIn delay={400}>
          <p className="text-body text-muted-foreground">
            This paragraph fades in 400ms after mount, over 420ms.
          </p>
        </FadeIn>
        <div className="relative h-64 overflow-hidden rounded-panel">
          <HeroCycle
            images={[
              { src: "/hero/1.jpg", alt: "" },
              { src: "/hero/2.jpg", alt: "" },
              { src: "/hero/3.jpg", alt: "" },
            ]}
          />
        </div>
      </section>
    </main>
  );
}
