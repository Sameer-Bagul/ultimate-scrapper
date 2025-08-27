import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Database, CheckCircle, Coins } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    activeJobs: number;
    totalRecords: number;
    successRate: number;
    creditsUsed: number;
  };
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-8 bg-muted rounded animate-pulse w-16"></div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg animate-pulse"></div>
              </div>
              <div className="mt-4">
                <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Active Jobs",
      value: stats?.activeJobs || 0,
      icon: Play,
      iconColor: "text-chart-1",
      iconBg: "bg-chart-1/10",
      badge: { text: "+2 today", color: "bg-chart-1/10 text-chart-1" },
    },
    {
      title: "Total Records",
      value: stats?.totalRecords || 0,
      icon: Database,
      iconColor: "text-chart-2",
      iconBg: "bg-chart-2/10",
      badge: { text: `+${Math.floor((stats?.totalRecords || 0) * 0.1)} today`, color: "bg-chart-2/10 text-chart-2" },
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate || 0}%`,
      icon: CheckCircle,
      iconColor: "text-chart-2",
      iconBg: "bg-chart-2/10",
      badge: { text: "+1.2% vs last week", color: "bg-chart-2/10 text-chart-2" },
    },
    {
      title: "Credits Used",
      value: stats?.creditsUsed || 0,
      icon: Coins,
      iconColor: "text-chart-3",
      iconBg: "bg-chart-3/10",
      badge: { text: `${10000 - (stats?.creditsUsed || 0)} remaining`, color: "bg-muted text-muted-foreground" },
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`${stat.iconColor} w-5 h-5`} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge className={`text-xs px-2 py-1 rounded-full ${stat.badge.color}`}>
                {stat.badge.text}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
