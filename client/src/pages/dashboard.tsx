import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import StatsCards from "@/components/dashboard/stats-cards";
import ActiveJobs from "@/components/dashboard/active-jobs";
import QuickActions from "@/components/dashboard/quick-actions";
import DataTable from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import CreateJobModal from "@/components/modals/create-job-modal";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isCreateJobModalOpen, setIsCreateJobModalOpen] = useState(false);

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Monitor your scraping operations</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                className="px-4 py-2"
                onClick={() => setIsCreateJobModalOpen(true)}
                data-testid="button-new-job"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Scrape Job
              </Button>
              <div className="relative">
                <Button variant="ghost" size="icon" data-testid="button-notifications">
                  <Bell className="w-5 h-5" />
                </Button>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <StatsCards stats={stats} isLoading={statsLoading} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActiveJobs />
            </div>
            <div>
              <QuickActions onCreateJob={() => setIsCreateJobModalOpen(true)} />
            </div>
          </div>
          
          <DataTable />
        </div>
      </main>

      <CreateJobModal 
        isOpen={isCreateJobModalOpen}
        onClose={() => setIsCreateJobModalOpen(false)}
      />
    </div>
  );
}
