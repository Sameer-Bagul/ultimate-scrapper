import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, Download, Eye, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataTable() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data: scrapedData, isLoading } = useQuery({
    queryKey: ["/api/scraped-data", { q: searchQuery, limit, offset: (currentPage - 1) * limit }],
  });

  const { data: totalCount } = useQuery({
    queryKey: ["/api/scraped-data/count"],
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

  const totalPages = totalCount ? Math.ceil(totalCount.count / limit) : 1;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Recent Scraped Data
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
                data-testid="input-search-data"
              />
            </div>
            <Button variant="outline" size="sm" data-testid="button-filter-data">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              size="sm"
              onClick={() => handleExport('json')}
              data-testid="button-export-json-quick"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-border animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-md"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : !scrapedData || scrapedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No scraped data found.</p>
            <Button 
              className="mt-4"
              onClick={() => window.location.href = "/new-job"}
              data-testid="button-create-first-job-table"
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
                  <TableRow key={record.id} data-testid={`table-row-${record.id}`}>
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
                          data-testid={`button-view-table-${record.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleCopyData(record)}
                          data-testid={`button-copy-table-${record.id}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          data-testid={`button-delete-table-${record.id}`}
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
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalCount?.count || 0)} of {totalCount?.count || 0} results
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  data-testid="button-previous-page-table"
                >
                  Previous
                </Button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      data-testid={`button-page-${pageNum}`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  data-testid="button-next-page-table"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
