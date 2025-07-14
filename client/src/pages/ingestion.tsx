import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ingestionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Upload, Database, FileText, Activity, AlertCircle, CheckCircle } from "lucide-react";

export default function Ingestion() {
  const [jsonData, setJsonData] = useState("");
  const [stixData, setStixData] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statusData, isLoading } = useQuery({
    queryKey: ['/api/ingestion/status'],
    queryFn: ingestionApi.getStatus,
    refetchInterval: 5000,
  });

  const ingestMutation = useMutation({
    mutationFn: ingestionApi.ingestData,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Data ingested successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ingestion/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/threats/realtime'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to ingest data",
        variant: "destructive",
      });
    },
  });

  const handleJsonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(jsonData);
      ingestMutation.mutate({
        format: 'json',
        content: parsedData.content || jsonData,
        source: parsedData.source || { type: 'manual', reliability: 0.7 },
        timestamp: new Date().toISOString(),
      });
      setJsonData("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const handleStixSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(stixData);
      ingestMutation.mutate({
        format: 'stix',
        ...parsedData,
      });
      setStixData("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid STIX format",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      ingestMutation.mutate({
        format: 'unstructured',
        file_content: content,
        file_type: selectedFile.type,
        filename: selectedFile.name,
        content: content,
        source: { type: 'file_upload', reliability: 0.6 },
        timestamp: new Date().toISOString(),
      });
      setSelectedFile(null);
    };
    reader.readAsText(selectedFile);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success';
      case 'processing':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'processing':
        return <Activity className="w-4 h-4 text-warning animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-error" />;
      default:
        return <Database className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Ingestion</h1>
          <p className="text-gray-400">Ingest and process intelligence data from various sources</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Sources</p>
                <p className="text-2xl font-bold text-white">
                  {statusData?.sources?.filter(s => s.status === 'active').length || 0}
                </p>
              </div>
              <Database className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Processing Queue</p>
                <p className="text-2xl font-bold text-white">
                  {statusData?.sources?.reduce((sum, s) => sum + (s.queue_size || 0), 0) || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">
                  {statusData?.success_rate ? `${(statusData.success_rate * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources Status */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Data Sources Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-4 bg-dark-elevated rounded-lg animate-pulse">
                  <div className="h-4 bg-gray-700 rounded w-1/4 mr-4" />
                  <div className="h-4 bg-gray-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {statusData?.sources?.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-dark-elevated rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(source.status)}
                    <div>
                      <h4 className="font-medium text-white">{source.name}</h4>
                      <p className="text-sm text-gray-400">
                        {source.type.toUpperCase()} • {source.last_updated}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-sm ${getStatusColor(source.status)}`}>
                      {source.status.charAt(0).toUpperCase() + source.status.slice(1)}
                    </span>
                    <span className="text-sm text-gray-400">{source.throughput}</span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-4" />
                  <p>No data sources configured</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Data Ingestion */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Manual Data Ingestion</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="json" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-dark-elevated">
              <TabsTrigger value="json">JSON Data</TabsTrigger>
              <TabsTrigger value="stix">STIX/TAXII</TabsTrigger>
              <TabsTrigger value="file">File Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="json" className="space-y-4">
              <form onSubmit={handleJsonSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="json-data" className="text-gray-300">
                    JSON Intelligence Data
                  </Label>
                  <Textarea
                    id="json-data"
                    placeholder='{"content": "Threat intelligence data...", "source": {"type": "manual", "reliability": 0.7}}'
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    className="min-h-[200px] bg-dark-elevated border-dark-border text-white font-mono"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={ingestMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {ingestMutation.isPending ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Ingest JSON Data
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="stix" className="space-y-4">
              <form onSubmit={handleStixSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="stix-data" className="text-gray-300">
                    STIX 2.1 Object
                  </Label>
                  <Textarea
                    id="stix-data"
                    placeholder='{"type": "indicator", "id": "indicator--...", "created": "2024-01-01T00:00:00.000Z", "modified": "2024-01-01T00:00:00.000Z", "pattern": "..."}'
                    value={stixData}
                    onChange={(e) => setStixData(e.target.value)}
                    className="min-h-[200px] bg-dark-elevated border-dark-border text-white font-mono"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={ingestMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {ingestMutation.isPending ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Ingest STIX Data
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="text-gray-300">
                    Upload File (TXT, PDF, DOCX)
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.docx,.json"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="bg-dark-elevated border-dark-border text-white"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-400 mt-2">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={ingestMutation.isPending || !selectedFile}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {ingestMutation.isPending ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
