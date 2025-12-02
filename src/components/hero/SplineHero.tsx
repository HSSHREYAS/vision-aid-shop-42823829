'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { Button } from "@/components/ui/button";
import { Camera, Mic, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
 
export function SplineHero() {
  return (
    <Card className="w-full h-[500px] md:h-[600px] bg-card/50 backdrop-blur-xl border-primary/20 relative overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="hsl(180 100% 50%)"
      />
      
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-6 md:p-10 relative z-10 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4 w-fit">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            AI-Powered Shopping
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="gradient-text">Smart</span>
            <span className="text-foreground">Shop</span>
          </h1>
          
          <p className="mt-4 text-muted-foreground max-w-lg text-lg">
            Experience shopping reimagined for accessibility. Point your camera, 
            hear product details, and shop with your voice.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Button variant="hero" size="lg" asChild>
              <Link to="/">
                <Camera className="mr-2 h-5 w-5" />
                Start Scanning
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="glass" size="lg">
              <Mic className="mr-2 h-5 w-5" />
              Voice Guide
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { label: 'Voice-First', value: 'TTS' },
              { label: 'AI Detection', value: 'YOLOv8' },
              { label: 'Accessible', value: 'WCAG' },
            ].map((feature) => (
              <div key={feature.label} className="text-center">
                <div className="text-2xl font-display font-bold text-primary text-neon-subtle">
                  {feature.value}
                </div>
                <div className="text-xs text-muted-foreground">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right content - 3D Scene */}
        <div className="flex-1 relative min-h-[250px] md:min-h-0">
          <div className="absolute inset-0 bg-gradient-radial-cyan opacity-30" />
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  );
}
