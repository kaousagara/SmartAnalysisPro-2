import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    two_fa_code: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(formData);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-slate-800 border-slate-700">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-blue-400 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white">Accès Sécurisé</h1>
            <p className="text-gray-400 mt-2">Système d'Analyse d'Intelligence</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-300 block mb-2">
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 w-full"
                placeholder="Entrez votre nom d'utilisateur"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 block mb-2">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 w-full pr-10"
                  placeholder="Entrez votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="two_fa_code" className="text-gray-300 block mb-2">
                Code 2FA (optionnel)
              </Label>
              <Input
                id="two_fa_code"
                type="text"
                value={formData.two_fa_code}
                onChange={(e) => handleInputChange('two_fa_code', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-gray-400 font-mono w-full"
                placeholder="123456"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500 bg-opacity-10 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authentification...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              <Lock className="inline w-3 h-3 mr-1" />
              Architecture Zero-Trust • Chiffrement AES-256
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            <p className="mb-2">Identifiants de démonstration :</p>
            <p>Utilisateur: <code className="bg-slate-700 px-2 py-1 rounded text-white">analyst</code></p>
            <p>Mot de passe: <code className="bg-slate-700 px-2 py-1 rounded text-white">analyst123</code></p>
            <p>2FA: <code className="bg-slate-700 px-2 py-1 rounded text-white">123456</code> (optionnel)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
