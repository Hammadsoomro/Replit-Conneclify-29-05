import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AnimatedLogo } from "@/components/animated-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiTwilio } from "react-icons/si";
import {
  MessageSquare,
  Users,
  Shield,
  Zap,
  Phone,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Radio,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Professional SMS",
    description: "Send and receive SMS messages through a sleek, unified interface designed for business communication.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Assign phone numbers to team members and manage conversations across your organization efficiently.",
  },
  {
    icon: Shield,
    title: "Multi-Provider Support",
    description: "Connect your own Twilio, SignalWire, or Telnyx account. Your credentials, your control.",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Instant message delivery with live status updates. Know when your messages are sent and delivered.",
  },
  {
    icon: Phone,
    title: "Number Management",
    description: "Purchase and manage phone numbers directly from your SMS provider through our platform.",
  },
  {
    icon: BarChart3,
    title: "Messaging Insights",
    description: "Track your messaging performance with detailed analytics and conversation metrics.",
  },
];

const benefits = [
  "No monthly platform fees - pay only for VOIP Charges",
  "Secure credential storage with industry-standard encryption",
  "Unlimited team members and phone numbers",
  "Custom ringtones for incoming messages",
  "real-time messaging",
  "Mobile-responsive design for on-the-go access",
];

export default function LandingPage() {
  useEffect(() => {
    document.title = "Conneclify - Professional SMS Messaging Platform";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" data-testid="link-home">
            <div className="flex items-center gap-3 cursor-pointer">
              <AnimatedLogo size="md" />
              <span className="font-bold text-xl">Conneclify</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <div data-testid="button-theme-toggle">
              <ThemeToggle />
            </div>
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button data-testid="link-signup">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                Conneclify
              </h1>
              <p className="text-xl md:text-2xl font-medium text-muted-foreground">
                Professional SMS Messaging Platform
              </p>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Streamline your business communication with our easy-to-use SMS platform. 
                Connect your own provider, manage your team, and engage customers efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/signup">
                  <Button size="lg" className="gap-2" data-testid="button-get-started">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" data-testid="button-sign-in">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to manage your business SMS communication in one place.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="hover-elevate">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-6">Why Choose Conneclify?</h2>
                  <ul className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 text-center">
                  <div className="mb-6">
                    <AnimatedLogo size="lg" className="mx-auto" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Ready to get started?</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your free account and start messaging in minutes.
                  </p>
                  <Link href="/signup">
                    <Button size="lg" className="w-full" data-testid="button-create-account">
                      Create Free Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Supported Providers</h2>
            <p className="text-muted-foreground mb-12 max-w-2xl mx-auto">
              We support the most popular platforms.
            </p>
            </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" data-testid="link-footer-home">
              <div className="flex items-center gap-3 cursor-pointer">
                <AnimatedLogo size="sm" />
                <span className="font-semibold">Conneclify</span>
              </div>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-foreground transition-colors" data-testid="link-privacy-policy">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground transition-colors" data-testid="link-terms-of-service">
                Terms of Service
              </Link>
            </nav>
            <div className="text-sm text-muted-foreground text-center md:text-right" data-testid="text-copyright">
              <p>&copy; {new Date().getFullYear()} Conneclify. All rights reserved.</p>
              <p className="mt-1">Crafted with signature elegance by— Hammad Soomro</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
