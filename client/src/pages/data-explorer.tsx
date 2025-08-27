import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Search, Download, Filter, Eye, Copy, Trash2 } from "lucide-react";
import { useLocation } from "wouter";

export default function DataExplorer() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

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

  const { data: scrapedData, isLoading: dataLoading } = useQuery<any[]>({
    queryKey: ["/api/scraped-data", { q: searchQuery, limit, offset: (currentPage - 1) * limit }],
    enabled: !!isAuthenticated,
  });

  const { data: totalCount } = useQuery<{ count: number }>({
    queryKey: ["/api/scraped-data/count"],
    enabled: !!isAuthenticated,
  });

  const handleExport = (format: 'json' | 'csv') => {
    const url = `/api/scraped-data/export?format=${format}`;
    window.open(url, '_blank');
  };

  const handleCopyData = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data.extractedData, null, 2));
    toast({
      title: "Success",
      description: "Data copied to clipboard",
    });
  };

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'ecommerce':
        return '🛒';
      case 'directory':
        return '🏢';
      case 'news':
        return '📰';
      case 'social':
        return '👥';
      default:
        return '🌐';
    }
  };

  const getDataTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ecommerce':
        return 'bg-chart-1/10 text-chart-1';
      case 'directory':
        return 'bg-chart-2/10 text-chart-2';
      case 'news':
        return 'bg-chart-3/10 text-chart-3';
      case 'social':
        return 'bg-chart-4/10 text-chart-4';
      default:
        return 'bg-muted text-muted-foreground';
    }
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

  const totalPages = totalCount ? Math.ceil(totalCount.count / limit) : 1;

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
              <h2 className="text-2xl font-bold text-foreground">Data Explorer</h2>
              <p className="text-muted-foreground">Browse and manage your scraped data</p>
            </div>
          </div>
        </header>

        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Scraped Data</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search data..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                      data-testid="input-search"
                    />
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleExport('json')}
                    data-testid="button-export-json"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export JSON
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleExport('csv')}
                    data-testid="button-export-csv"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !scrapedData || scrapedData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No scraped data found.</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setLocation("/new-job")}
                    data-testid="button-create-first-job"
                  >
                    Create Your First Scraping Job
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Contact Info</TableHead>
                        <TableHead>Scraped</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scrapedData.map((record: any) => (
                        <TableRow key={record.id} data-testid={`row-data-${record.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-sm">
                                {getDataTypeIcon(record.dataType)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {new URL(record.sourceUrl).hostname}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {record.extractedData.title || 'No title'}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getDataTypeBadgeColor(record.dataType)}>
                              {record.dataType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {record.extractedData.email && (
                                <p className="text-foreground font-medium">
                                  {record.extractedData.email}
                                </p>
                              )}
                              {record.extractedData.phone && (
                                <p className="text-muted-foreground">
                                  {record.extractedData.phone}
                                </p>
                              )}
                              {record.extractedData.name && (
                                <p className="text-muted-foreground">
                                  {record.extractedData.name}
                                </p>
                              )}
                              {!record.extractedData.email && !record.extractedData.phone && !record.extractedData.name && (
                                <p className="text-muted-foreground">No contact info</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="w-8 h-8"
                                data-testid={`button-view-${record.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => handleCopyData(record)}
                                data-testid={`button-copy-${record.id}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="w-8 h-8 text-destructive hover:text-destructive"
                                data-testid={`button-delete-${record.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalCount?.count || 0)} of {totalCount?.count || 0} results
                    </p>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        data-testid="button-previous-page"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-3">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        data-testid="button-next-page"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
