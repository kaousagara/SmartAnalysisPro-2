import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Download, FileText, Filter, Search, TrendingUp, Plus, Clock, User, Eye, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function Reports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedTab, setSelectedTab] = useState("recent");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "",
    type: "",
    classification: "",
    date_range: { start: "", end: "" },
    include_sections: [],
    format: "PDF"
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const response = await fetch('/api/reports');
      if (!response.ok) throw new Error('Failed to fetch reports');
      return response.json();
    }
  });

  // Fetch templates
  const { data: templatesData } = useQuery({
    queryKey: ['/api/reports/templates'],
    queryFn: async () => {
      const response = await fetch('/api/reports/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (formData: any) => {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Rapport généré avec succès",
        description: `Le rapport "${data.report.title}" a été généré.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      setIsGenerateModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le rapport. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  });

  const reports = reportsData?.reports || [];
  const templates = templatesData?.templates || [];

  const resetForm = () => {
    setReportForm({
      title: "",
      type: "",
      classification: "",
      date_range: { start: "", end: "" },
      include_sections: [],
      format: "PDF"
    });
  };

  const handleGenerateReport = () => {
    if (!reportForm.title || !reportForm.type || !reportForm.classification) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    generateReportMutation.mutate(reportForm);
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) throw new Error('Failed to download report');
      
      const data = await response.json();
      toast({
        title: "Téléchargement initié",
        description: "Le téléchargement du rapport a commencé.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le rapport.",
        variant: "destructive",
      });
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "TOP SECRET":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "SECRET":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "CONFIDENTIAL":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Generating":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFilteredReportsByStatus = (status: string) => {
    switch (status) {
      case "recent":
        return filteredReports.sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime());
      case "published":
        return filteredReports.filter(report => report.status === "Published");
      case "drafts":
        return filteredReports.filter(report => report.status === "Draft");
      case "templates":
        return templates;
      default:
        return filteredReports;
    }
  };

  return (
    <div className="space-y-6 p-6 min-h-screen bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Rapports</h1>
          <p className="text-gray-400 mt-2">Générez et gérez vos rapports d'intelligence</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Générer un Rapport
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white text-xl">Générer un Nouveau Rapport</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Titre du rapport *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Analyse hebdomadaire des menaces"
                      value={reportForm.title}
                      onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                      className="bg-gray-900 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-gray-300">Type de rapport *</Label>
                    <Select value={reportForm.type} onValueChange={(value) => setReportForm({...reportForm, type: value})}>
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue placeholder="Sélectionnez le type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="Intelligence Summary">Résumé d'intelligence</SelectItem>
                        <SelectItem value="Threat Assessment">Évaluation des menaces</SelectItem>
                        <SelectItem value="Regional Analysis">Analyse régionale</SelectItem>
                        <SelectItem value="Incident Report">Rapport d'incident</SelectItem>
                        <SelectItem value="Weekly Summary">Résumé hebdomadaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classification" className="text-gray-300">Classification *</Label>
                    <Select value={reportForm.classification} onValueChange={(value) => setReportForm({...reportForm, classification: value})}>
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue placeholder="Niveau de classification" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="CONFIDENTIAL">CONFIDENTIEL</SelectItem>
                        <SelectItem value="SECRET">SECRET</SelectItem>
                        <SelectItem value="TOP SECRET">TOP SECRET</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-gray-300">Format</Label>
                    <Select value={reportForm.format} onValueChange={(value) => setReportForm({...reportForm, format: value})}>
                      <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                        <SelectValue placeholder="Format de sortie" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="DOCX">DOCX</SelectItem>
                        <SelectItem value="HTML">HTML</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-gray-300">Date de début</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={reportForm.date_range.start}
                      onChange={(e) => setReportForm({...reportForm, date_range: {...reportForm.date_range, start: e.target.value}})}
                      className="bg-gray-900 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-gray-300">Date de fin</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={reportForm.date_range.end}
                      onChange={(e) => setReportForm({...reportForm, date_range: {...reportForm.date_range, end: e.target.value}})}
                      className="bg-gray-900 border-gray-600 text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleGenerateReport}
                    disabled={generateReportMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {generateReportMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Générer
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total des Rapports</p>
                <p className="text-2xl font-bold text-white">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ce Mois</p>
                <p className="text-2xl font-bold text-white">{reports.filter(r => new Date(r.created_at || r.date).getMonth() === new Date().getMonth()).length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Brouillons</p>
                <p className="text-2xl font-bold text-white">{reports.filter(r => r.status === 'Draft').length}</p>
              </div>
              <FileText className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tps Traitement Moy.</p>
                <p className="text-2xl font-bold text-white">2.3h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher des rapports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-600 text-white focus:border-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="filter-start-date" className="text-gray-400">De:</Label>
              <Input
                id="filter-start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-gray-900 border-gray-600 text-white focus:border-blue-500"
              />
              <Label htmlFor="filter-end-date" className="text-gray-400">À:</Label>
              <Input
                id="filter-end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-gray-900 border-gray-600 text-white focus:border-blue-500"
              />
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
          <TabsTrigger value="recent" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Récents</TabsTrigger>
          <TabsTrigger value="published" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Publiés</TabsTrigger>
          <TabsTrigger value="drafts" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Brouillons</TabsTrigger>
          <TabsTrigger value="templates" className="text-gray-300 data-[state=active]:bg-gray-700 data-[state=active]:text-white">Modèles</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          {reportsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredReportsByStatus("recent").map((report) => (
                <Card key={report.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-semibold text-white">
                            {report.title}
                          </h3>
                          <Badge className={`${getClassificationColor(report.classification)} text-xs border`}>
                            {report.classification}
                          </Badge>
                          <Badge className={`${getStatusColor(report.status)} text-xs border`}>
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
                          {report.author && (
                            <span className="text-sm text-gray-400">
                              <User className="w-4 h-4 inline mr-1" />
                              {report.author}
                            </span>
                          )}
                          <span className="text-sm text-gray-400">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(report.created_at || report.date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <span>{report.pages} pages</span>
                          <span>{report.threats} menaces analysées</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadReport(report.id)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Télécharger
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getFilteredReportsByStatus("recent").length === 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Aucun rapport trouvé</h3>
                    <p className="text-gray-400">
                      {searchTerm ? 'Essayez de modifier vos critères de recherche' : 'Aucun rapport disponible'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="published">
          <div className="space-y-4">
            {getFilteredReportsByStatus("published").map((report) => (
              <Card key={report.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                        <Badge className={`${getClassificationColor(report.classification)} text-xs border`}>
                          {report.classification}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{report.type}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Publié le {new Date(report.created_at || report.date).toLocaleDateString('fr-FR')}</span>
                        <span>{report.pages} pages</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Eye className="w-4 h-4 mr-2" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownloadReport(report.id)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getFilteredReportsByStatus("published").length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Aucun rapport publié</h3>
                  <p className="text-gray-400">Les rapports publiés apparaîtront ici</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts">
          <div className="space-y-4">
            {getFilteredReportsByStatus("drafts").map((report) => (
              <Card key={report.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">{report.title}</h3>
                        <Badge className={`${getClassificationColor(report.classification)} text-xs border`}>
                          {report.classification}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{report.type}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Modifié le {new Date(report.created_at || report.date).toLocaleDateString('fr-FR')}</span>
                        <span>{report.pages} pages</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Eye className="w-4 h-4 mr-2" />
                        Continuer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {getFilteredReportsByStatus("drafts").length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Aucun brouillon</h3>
                  <p className="text-gray-400">Vos brouillons de rapports apparaîtront ici</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">{template.name}</h3>
                        <Badge className={`${getClassificationColor(template.classification)} text-xs border`}>
                          {template.classification}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>{template.sections.length} sections</span>
                        <span>{template.sections.join(', ')}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Utiliser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Aucun modèle</h3>
                  <p className="text-gray-400">Les modèles de rapports apparaîtront ici</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
