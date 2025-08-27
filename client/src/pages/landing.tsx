import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Globe, Database, Zap, Shield, BarChart3 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="gradient-bg">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold text-foreground">WebScraper Pro</h1>
            </div>
            
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Extract Data from Any Website
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Advanced web scraping platform with contact extraction, real-time monitoring, 
              and enterprise-grade reliability. Start extracting valuable data today.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="px-8 py-3 text-lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-3 text-lg"
                data-testid="button-learn-more"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Everything You Need for Web Scraping
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From simple data extraction to complex multi-site operations, 
            our platform handles it all with enterprise-grade security and reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-chart-1" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                High-performance scraping engine with parallel processing and intelligent rate limiting.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                <Database className="w-6 h-6 text-chart-2" />
              </div>
              <CardTitle>Smart Data Extraction</CardTitle>
              <CardDescription>
                Automatically extract contacts, emails, phone numbers, and structured data from any website.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-chart-3" />
              </div>
              <CardTitle>Real-time Monitoring</CardTitle>
              <CardDescription>
                Track scraping progress, view logs, and monitor performance with live dashboards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-chart-4" />
              </div>
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Advanced proxy rotation, CAPTCHA solving, and anti-detection measures built-in.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-chart-5" />
              </div>
              <CardTitle>Domain Adapters</CardTitle>
              <CardDescription>
                Pre-built adapters for popular sites or create custom extractors for any website.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Export & Integration</CardTitle>
              <CardDescription>
                Export data in multiple formats (CSV, JSON) or integrate with your existing workflows via API.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-secondary/50 border-t border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Ready to Extract Data at Scale?
            </h3>
            <p className="text-muted-foreground text-lg mb-8">
              Join thousands of developers and businesses who trust WebScraper Pro 
              for their data extraction needs.
            </p>
            <Button 
              size="lg" 
              className="px-8 py-3 text-lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-start-scraping"
            >
              Start Scraping Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
