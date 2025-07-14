import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Download, FileText, Filter, Search, TrendingUp } from "lucide-react";

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Mock reports data
  const reports = [
    {
      id: "RPT-2024-001",
      title: "Weekly Threat Intelligence Summary",
      type: "Intelligence Summary",
      date: "2024-01-15",
      status: "Published",
      classification: "SECRET",
      pages: 15,
      threats: 23,
    },
    {
      id: "RPT-2024-002",
      title: "APT Group XYZ Activity Assessment",
      type: "Threat Assessment",
      date: "2024-01-14",
      status: "Published",
      classification: "TOP SECRET",
      pages: 8,
      threats: 5,
    },
    {
      id: "RPT-2024-003",
      title: "Mali Regional Security Analysis",
      type: "Regional Analysis",
      date: "2024-01-13",
      status: "Draft",
      classification: "CONFIDENTIAL",
      pages: 22,
      threats: 12,
    },
  ];

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "TOP SECRET":
        return "bg-red-500 bg-opacity-20 text-red-400 border-red-500";
      case "SECRET":
        return "bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500";
      case "CONFIDENTIAL":
        return "bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500 bg-opacity-20 text-green-400 border-green-500";
      case "Draft":
        return "bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500";
    }
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-400">Generate and manage intelligence reports</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button className="bg-primary hover:bg-primary/90 text-white">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Reports</p>
                <p className="text-2xl font-bold text-white">247</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-white">18</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Draft Reports</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
              <FileText className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg. Processing</p>
                <p className="text-2xl font-bold text-white">2.3h</p>
              </div>
              <Calendar className="w-8 h-8 text-accent-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-elevated border-dark-border text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="start-date" className="text-gray-400">From:</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-dark-elevated border-dark-border text-white"
              />
              <Label htmlFor="end-date" className="text-gray-400">To:</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-dark-elevated border-dark-border text-white"
              />
              <Button variant="outline" className="border-dark-border text-gray-300 hover:bg-dark-elevated">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface">
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <Card key={report.id} className="bg-dark-surface border-dark-border hover:border-gray-600 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold text-white">
                          {report.title}
                        </h3>
                        <Badge className={`${getClassificationColor(report.classification)} text-xs`}>
                          {report.classification}
                        </Badge>
                        <Badge className={`${getStatusColor(report.status)} text-xs`}>
                          {report.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6 mb-4">
                        <span className="text-sm text-gray-400">
                          <strong>ID:</strong> {report.id}
                        </span>
                        <span className="text-sm text-gray-400">
                          <strong>Type:</strong> {report.type}
                        </span>
                        <span className="text-sm text-gray-400">
                          <strong>Date:</strong> {new Date(report.date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400">
                        <span>{report.pages} pages</span>
                        <span>{report.threats} threats analyzed</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dark-border text-gray-300 hover:bg-dark-elevated"
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-dark-border text-gray-300 hover:bg-dark-elevated"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredReports.length === 0 && (
              <Card className="bg-dark-surface border-dark-border">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No reports found</h3>
                  <p className="text-gray-400">
                    {searchTerm ? 'Try adjusting your search criteria' : 'No reports available'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="published">
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Published Reports</h3>
              <p className="text-gray-400">View all published intelligence reports</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Draft Reports</h3>
              <p className="text-gray-400">Continue working on draft reports</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Report Templates</h3>
              <p className="text-gray-400">Manage and create report templates</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
