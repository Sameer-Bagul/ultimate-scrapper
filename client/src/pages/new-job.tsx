import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Play } from "lucide-react";

export default function NewJob() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    name: "",
    urls: "",
    adapterType: "",
    config: {
      rateLimit: 1,
      maxDepth: 3,
      timeout: 30,
      useProxy: false,
      extractContacts: true,
      followLinks: true,
      useJavaScript: false,
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: adapters } = useQuery({
    queryKey: ["/api/domain-adapters"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await apiRequest("POST", "/api/scraping-jobs", jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scraping job created and started successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      setLocation("/");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create scraping job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a job name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.urls.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter at least one URL.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.adapterType) {
      toast({
        title: "Validation Error",
        description: "Please select an adapter type.",
        variant: "destructive",
      });
      return;
    }

    const urls = formData.urls
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    createJobMutation.mutate({
      name: formData.name,
      urls,
      adapterType: formData.adapterType,
      config: formData.config,
    });
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Create New Scraping Job</h2>
              <p className="text-muted-foreground">Configure and start a new web scraping operation</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Job Configuration</CardTitle>
                <CardDescription>
                  Set up your scraping job with target URLs, adapter settings, and advanced options.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="jobName">Job Name *</Label>
                      <Input
                        id="jobName"
                        placeholder="Enter job name..."
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="input-job-name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adapterType">Adapter Type *</Label>
                      <Select 
                        value={formData.adapterType} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, adapterType: value }))}
                      >
                        <SelectTrigger data-testid="select-adapter-type">
                          <SelectValue placeholder="Select adapter..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ecommerce">E-commerce</SelectItem>
                          <SelectItem value="directory">Business Directory</SelectItem>
                          <SelectItem value="news">News Articles</SelectItem>
                          <SelectItem value="social">Social Media</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="urls">Target URLs *</Label>
                    <Textarea
                      id="urls"
                      placeholder="Enter URLs (one per line)..."
                      rows={4}
                      value={formData.urls}
                      onChange={(e) => setFormData(prev => ({ ...prev, urls: e.target.value }))}
                      className="resize-none"
                      data-testid="textarea-urls"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one URL per line. Supports wildcards and patterns.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rateLimit">Rate Limit (req/sec)</Label>
                      <Input
                        id="rateLimit"
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={formData.config.rateLimit}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          config: { ...prev.config, rateLimit: parseFloat(e.target.value) }
                        }))}
                        data-testid="input-rate-limit"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxDepth">Max Depth</Label>
                      <Input
                        id="maxDepth"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.config.maxDepth}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          config: { ...prev.config, maxDepth: parseInt(e.target.value) }
                        }))}
                        data-testid="input-max-depth"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        min="5"
                        max="300"
                        value={formData.config.timeout}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          config: { ...prev.config, timeout: parseInt(e.target.value) }
                        }))}
                        data-testid="input-timeout"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-foreground">Advanced Options</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="useProxy"
                          checked={formData.config.useProxy}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config, useProxy: !!checked }
                          }))}
                          data-testid="checkbox-use-proxy"
                        />
                        <Label htmlFor="useProxy">Use Proxy Rotation</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="extractContacts"
                          checked={formData.config.extractContacts}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config, extractContacts: !!checked }
                          }))}
                          data-testid="checkbox-extract-contacts"
                        />
                        <Label htmlFor="extractContacts">Extract Contact Info</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="followLinks"
                          checked={formData.config.followLinks}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config, followLinks: !!checked }
                          }))}
                          data-testid="checkbox-follow-links"
                        />
                        <Label htmlFor="followLinks">Follow Links</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="useJavaScript"
                          checked={formData.config.useJavaScript}
                          onCheckedChange={(checked) => setFormData(prev => ({ 
                            ...prev, 
                            config: { ...prev.config, useJavaScript: !!checked }
                          }))}
                          data-testid="checkbox-use-javascript"
                        />
                        <Label htmlFor="useJavaScript">JavaScript Rendering</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setLocation("/")}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createJobMutation.isPending}
                      data-testid="button-start-scraping"
                    >
                      {createJobMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Scraping
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
