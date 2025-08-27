import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, X } from "lucide-react";

const createJobSchema = z.object({
  name: z.string().min(1, "Job name is required"),
  urls: z.string().min(1, "At least one URL is required"),
  adapterType: z.string().min(1, "Adapter type is required"),
  rateLimit: z.number().min(0.1).max(10),
  maxDepth: z.number().min(1).max(10),
  timeout: z.number().min(5).max(300),
  useProxy: z.boolean(),
  extractContacts: z.boolean(),
  followLinks: z.boolean(),
  useJavaScript: z.boolean(),
});

type CreateJobFormData = z.infer<typeof createJobSchema>;

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const { toast } = useToast();

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      name: "",
      urls: "",
      adapterType: "",
      rateLimit: 1,
      maxDepth: 3,
      timeout: 30,
      useProxy: false,
      extractContacts: true,
      followLinks: true,
      useJavaScript: false,
    },
  });

  const { data: adapters } = useQuery({
    queryKey: ["/api/domain-adapters"],
    enabled: isOpen,
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: CreateJobFormData) => {
      const urls = data.urls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const jobData = {
        name: data.name,
        urls,
        adapterType: data.adapterType,
        config: {
          rateLimit: data.rateLimit,
          maxDepth: data.maxDepth,
          timeout: data.timeout,
          useProxy: data.useProxy,
          extractContacts: data.extractContacts,
          followLinks: data.followLinks,
          useJavaScript: data.useJavaScript,
        },
      };

      const response = await apiRequest("POST", "/api/scraping-jobs", jobData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scraping job created and started successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      form.reset();
      onClose();
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

  const onSubmit = (data: CreateJobFormData) => {
    createJobMutation.mutate(data);
  };

  const handleClose = () => {
    if (!createJobMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                Create New Scraping Job
              </DialogTitle>
              <DialogDescription className="text-muted-foreground mt-1">
                Configure and start a new web scraping operation
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={createJobMutation.isPending}
              data-testid="button-close-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Job Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter job name..."
                        className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                        data-testid="input-modal-job-name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adapterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Adapter Type *
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          className="bg-input border-border text-foreground"
                          data-testid="select-modal-adapter-type"
                        >
                          <SelectValue placeholder="Select adapter..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="directory">Business Directory</SelectItem>
                        <SelectItem value="news">News Articles</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="urls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-foreground">
                    Target URLs *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter URLs (one per line)..."
                      rows={4}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
                      data-testid="textarea-modal-urls"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-muted-foreground">
                    Enter one URL per line. Supports wildcards and patterns.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="rateLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Rate Limit (req/sec)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        className="bg-input border-border text-foreground"
                        data-testid="input-modal-rate-limit"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxDepth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Max Depth
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        className="bg-input border-border text-foreground"
                        data-testid="input-modal-max-depth"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Timeout (seconds)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="5"
                        max="300"
                        className="bg-input border-border text-foreground"
                        data-testid="input-modal-timeout"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Advanced Options</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="useProxy"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                          data-testid="checkbox-modal-use-proxy"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-foreground">
                          Use Proxy Rotation
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="extractContacts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                          data-testid="checkbox-modal-extract-contacts"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-foreground">
                          Extract Contact Info
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followLinks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                          data-testid="checkbox-modal-follow-links"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-foreground">
                          Follow Links
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="useJavaScript"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-border"
                          data-testid="checkbox-modal-use-javascript"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-foreground">
                          JavaScript Rendering
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createJobMutation.isPending}
                data-testid="button-modal-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createJobMutation.isPending}
                className="px-6 font-medium"
                data-testid="button-modal-start-scraping"
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
        </Form>
      </DialogContent>
    </Dialog>
  );
}
