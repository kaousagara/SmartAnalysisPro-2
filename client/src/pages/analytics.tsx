import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { BarChart, LineChart, PieChart, TrendingUp, Download, Filter } from "lucide-react";

export default function Analytics() {
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  const { data: threatEvolution } = useQuery({
    queryKey: ['/api/threats/evolution'],
    queryFn: dashboardApi.getThreatEvolution,
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">Advanced threat analysis and intelligence metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="border-dark-border text-gray-300 hover:bg-dark-elevated">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-dark-border text-gray-300 hover:bg-dark-elevated">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Detection Rate</p>
                <p className="text-2xl font-bold text-white">94.2%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Precision</p>
                <p className="text-2xl font-bold text-white">91.7%</p>
              </div>
              <BarChart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Response Time</p>
                <p className="text-2xl font-bold text-white">320ms</p>
              </div>
              <LineChart className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Model Accuracy</p>
                <p className="text-2xl font-bold text-white">96.8%</p>
              </div>
              <PieChart className="w-8 h-8 text-accent-orange" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Threat Patterns</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="ml">ML Models</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Model Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Precision</span>
                    <span className="text-white font-mono">0.917</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Recall</span>
                    <span className="text-white font-mono">0.942</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">F1-Score</span>
                    <span className="text-white font-mono">0.929</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">AUC-ROC</span>
                    <span className="text-white font-mono">0.968</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Response Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">P50 (Median)</span>
                    <span className="text-white font-mono">180ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">P90</span>
                    <span className="text-white font-mono">320ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">P95</span>
                    <span className="text-white font-mono">385ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">P99</span>
                    <span className="text-white font-mono">450ms</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Weekly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <p>Performance trends visualization</p>
                  <p className="text-sm">Chart integration coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Threat Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">APT Activities</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-dark-elevated rounded-full">
                        <div className="w-3/4 h-full bg-error rounded-full" />
                      </div>
                      <span className="text-white font-mono">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Network Intrusions</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-dark-elevated rounded-full">
                        <div className="w-1/2 h-full bg-warning rounded-full" />
                      </div>
                      <span className="text-white font-mono">32%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Malware</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-dark-elevated rounded-full">
                        <div className="w-1/4 h-full bg-primary rounded-full" />
                      </div>
                      <span className="text-white font-mono">18%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Other</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 h-2 bg-dark-elevated rounded-full">
                        <div className="w-1/12 h-full bg-gray-400 rounded-full" />
                      </div>
                      <span className="text-white font-mono">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-dark-surface border-dark-border">
              <CardHeader>
                <CardTitle className="text-white">Geographic Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">West Africa</span>
                    <span className="text-white font-mono">38%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Middle East</span>
                    <span className="text-white font-mono">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Eastern Europe</span>
                    <span className="text-white font-mono">22%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Other Regions</span>
                    <span className="text-white font-mono">15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Data Source Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-dark-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">STIX/TAXII</h4>
                    <p className="text-2xl font-bold text-success">94.2%</p>
                    <p className="text-sm text-gray-400">Reliability Score</p>
                  </div>
                  <div className="bg-dark-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">JSON Feeds</h4>
                    <p className="text-2xl font-bold text-warning">87.6%</p>
                    <p className="text-sm text-gray-400">Reliability Score</p>
                  </div>
                  <div className="bg-dark-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Unstructured</h4>
                    <p className="text-2xl font-bold text-primary">72.3%</p>
                    <p className="text-sm text-gray-400">Reliability Score</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ml" className="space-y-6">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white">Machine Learning Models</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-dark-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">BERT Intention Classifier</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy</span>
                        <span className="text-white font-mono">91.7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Training</span>
                        <span className="text-white font-mono">2h ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-dark-elevated p-4 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Random Forest Scorer</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Accuracy</span>
                        <span className="text-white font-mono">94.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Training</span>
                        <span className="text-white font-mono">1d ago</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-dark-elevated p-4 rounded-lg">
                  <h4 className="font-medium text-white mb-4">Model Performance Over Time</h4>
                  <div className="h-32 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <LineChart className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Model performance chart</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
