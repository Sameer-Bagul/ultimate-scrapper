import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Settings, Circle } from "lucide-react";

interface QuickActionsProps {
  onCreateJob: () => void;
}

export default function QuickActions({ onCreateJob }: QuickActionsProps) {
  const handleExportData = () => {
    window.open('/api/scraped-data/export?format=json', '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full justify-start p-3 h-auto bg-primary/10 hover:bg-primary/20 border border-primary/20 text-left"
            variant="ghost"
            onClick={onCreateJob}
            data-testid="button-quick-new-scrape"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-4 h-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Start New Scrape</p>
                <p className="text-xs text-muted-foreground">Create a new scraping job</p>
              </div>
            </div>
          </Button>
          
          <Button
            className="w-full justify-start p-3 h-auto"
            variant="ghost"
            onClick={handleExportData}
            data-testid="button-quick-export"
          >
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Export Data</p>
                <p className="text-xs text-muted-foreground">Download recent results</p>
              </div>
            </div>
          </Button>
          
          <Button
            className="w-full justify-start p-3 h-auto"
            variant="ghost"
            onClick={() => window.location.href = "/adapters"}
            data-testid="button-quick-adapters"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">Manage Adapters</p>
                <p className="text-xs text-muted-foreground">Configure site adapters</p>
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Scraping Engine</span>
            <div className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-chart-2 text-chart-2" />
              <span className="text-xs text-chart-2">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Database</span>
            <div className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-chart-2 text-chart-2" />
              <span className="text-xs text-chart-2">Connected</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Proxy Pool</span>
            <div className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-chart-3 text-chart-3" />
              <span className="text-xs text-chart-3">47 Active</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Rate Limiter</span>
            <div className="flex items-center gap-2">
              <Circle className="w-2 h-2 fill-chart-2 text-chart-2" />
              <span className="text-xs text-chart-2">Normal</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
