import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Globe, Mail, Newspaper, Pause, Square, Play, Trash2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function ActiveJobs() {
  const { toast } = useToast();

  const { data: jobs, isLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/scraping-jobs"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateJobStatusMutation = useMutation({
    mutationFn: async ({ jobId, status }: { jobId: string; status: string }) => {
      await apiRequest("PATCH", `/api/scraping-jobs/${jobId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scraping-jobs"] });
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
        description: "Failed to update job status",
        variant: "destructive",
      });
    },
  });

  const getJobIcon = (adapterType: string) => {
    switch (adapterType) {
      case 'ecommerce':
        return Globe;
      case 'directory':
        return Mail;
      case 'news':
        return Newspaper;
      default:
        return Globe;
    }
  };

  const getJobIconColor = (adapterType: string) => {
    switch (adapterType) {
      case 'ecommerce':
        return 'text-primary';
      case 'directory':
        return 'text-chart-2';
      case 'news':
        return 'text-chart-3';
      default:
        return 'text-primary';
    }
  };

  const getJobIconBg = (adapterType: string) => {
    switch (adapterType) {
      case 'ecommerce':
        return 'bg-primary/10';
      case 'directory':
        return 'bg-chart-2/10';
      case 'news':
        return 'bg-chart-3/10';
      default:
        return 'bg-primary/10';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-chart-1 text-primary-foreground">Running</Badge>;
      case 'completed':
        return <Badge className="bg-chart-2 text-primary-foreground">Completed</Badge>;
      case 'paused':
        return <Badge className="bg-chart-3 text-primary-foreground">Paused</Badge>;
      case 'failed':
        return <Badge className="bg-destructive text-destructive-foreground">Failed</Badge>;
      case 'queued':
        return <Badge className="bg-muted text-muted-foreground">Queued</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const formatDuration = (startedAt: string | null) => {
    if (!startedAt) return '-';
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const handleJobAction = (jobId: string, action: string) => {
    updateJobStatusMutation.mutate({ jobId, status: action });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Active Scraping Jobs
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            data-testid="button-refresh-jobs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-accent/30 rounded-lg border border-border/50 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-48"></div>
                      <div className="h-3 bg-muted rounded w-32"></div>
                      <div className="h-6 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-3 bg-muted rounded w-16"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-muted rounded-md"></div>
                      <div className="w-8 h-8 bg-muted rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No active jobs found.</p>
            <Button className="mt-4" onClick={() => window.location.href = "/new-job"}>
              Create Your First Job
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.slice(0, 5).map((job: any) => {
              const JobIcon = getJobIcon(job.adapterType);
              return (
                <div 
                  key={job.id} 
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border/50"
                  data-testid={`job-card-${job.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${getJobIconBg(job.adapterType)} rounded-lg flex items-center justify-center`}>
                      <JobIcon className={`w-5 h-5 ${getJobIconColor(job.adapterType)}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{job.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {job.urls[0]} {job.urls.length > 1 && `+${job.urls.length - 1} more`}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(job.status)}
                        {job.status === 'running' && (
                          <span className="text-xs text-muted-foreground">
                            Progress: {job.progress || 0}%
                          </span>
                        )}
                      </div>
                      {job.status === 'running' && (
                        <Progress 
                          value={job.progress || 0} 
                          className="w-48 h-2 mt-2"
                        />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {job.recordsFound || 0} records
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDuration(job.startedAt)}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {job.status === 'running' ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleJobAction(job.id, 'paused')}
                          disabled={updateJobStatusMutation.isPending}
                          data-testid={`button-pause-${job.id}`}
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      ) : job.status === 'paused' ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleJobAction(job.id, 'running')}
                          disabled={updateJobStatusMutation.isPending}
                          data-testid={`button-resume-${job.id}`}
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8"
                          disabled
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleJobAction(job.id, 'failed')}
                        disabled={updateJobStatusMutation.isPending}
                        data-testid={`button-stop-${job.id}`}
                      >
                        <Square className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
