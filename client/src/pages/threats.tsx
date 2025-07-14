import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, feedbackApi } from "@/lib/api";
import { Search, Filter, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Threats() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");

  const { data: threatsData, isLoading } = useQuery({
    queryKey: ['/api/threats/realtime', 100],
    queryFn: () => dashboardApi.getRealtimeThreats(100),
    refetchInterval: 5000,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      default:
        return 'severity-low';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return 'threat-score-critical';
    if (score >= 0.60) return 'threat-score-high';
    if (score >= 0.40) return 'threat-score-medium';
    return 'threat-score-low';
  };

  const handleFeedback = async (threatId: string, feedback: string) => {
    try {
      await feedbackApi.submitFeedback(threatId, feedback, {});
      // Refresh data or show success message
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const threats = threatsData?.threats || [];
  const filteredThreats = threats.filter(threat => {
    const matchesSearch = !searchTerm || 
      threat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = !selectedSeverity || threat.severity === selectedSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  const activeThreatCount = threats.filter(t => t.severity === 'critical' || t.severity === 'high').length;
  const averageScore = threats.length > 0 ? 
    threats.reduce((sum, t) => sum + t.score, 0) / threats.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Threat Detection</h1>
          <p className="text-gray-400">Monitor and analyze security threats in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-error border-error">
            {activeThreatCount} Active
          </Badge>
          <Badge variant="outline" className="text-warning border-warning">
            Avg Score: {averageScore.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-elevated border-dark-border text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-dark-elevated border-dark-border text-white rounded-md px-3 py-2"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threats List */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-dark-surface">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="bg-dark-surface border-dark-border animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-6 bg-gray-700 rounded w-1/4 mb-4" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredThreats.map((threat) => (
                <Card key={threat.id} className="bg-dark-surface border-dark-border hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 ${getScoreColor(threat.score)}`} />
                          <h3 className="text-lg font-semibold text-white">
                            {threat.name || threat.id}
                          </h3>
                          <Badge className={`${getSeverityColor(threat.severity)} text-xs`}>
                            {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-6 mb-4">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className={`text-2xl font-bold ${getScoreColor(threat.score)}`}>
                              {threat.score.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(threat.id, 'true_positive')}
                          className="text-success border-success hover:bg-success hover:text-white"
                        >
                          Valid
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFeedback(threat.id, 'false_positive')}
                          className="text-error border-error hover:bg-error hover:text-white"
                        >
                          False +
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredThreats.length === 0 && (
                <Card className="bg-dark-surface border-dark-border">
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No threats found</h3>
                    <p className="text-gray-400">
                      {searchTerm || selectedSeverity ? 
                        'Try adjusting your search or filter criteria' : 
                        'No active threats detected at this time'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="timeline">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Threat Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Timeline View</h3>
                <p>Timeline visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
