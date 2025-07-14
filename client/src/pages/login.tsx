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
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <Card className="w-full max-w-md mx-4 bg-dark-surface border-dark-border">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-white">Secure Access</h1>
            <p className="text-gray-400 mt-2">Intelligence Analysis System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className="bg-dark-elevated border-dark-border text-white placeholder-gray-400"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="bg-dark-elevated border-dark-border text-white placeholder-gray-400 pr-10"
                  placeholder="Enter password"
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
              <Label htmlFor="two_fa_code" className="text-gray-300">
                2FA Code
              </Label>
              <Input
                id="two_fa_code"
                type="text"
                value={formData.two_fa_code}
                onChange={(e) => handleInputChange('two_fa_code', e.target.value)}
                className="bg-dark-elevated border-dark-border text-white placeholder-gray-400 font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            {error && (
              <div className="text-error text-sm text-center bg-error bg-opacity-10 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              <Lock className="inline w-3 h-3 mr-1" />
              Zero-Trust Architecture • AES-256 Encryption
            </p>
          </div>

          <div className="mt-4 text-center text-xs text-gray-400">
            <p>Demo credentials:</p>
            <p>Username: <code className="bg-dark-elevated px-1 rounded">analyst</code></p>
            <p>Password: <code className="bg-dark-elevated px-1 rounded">analyst123</code></p>
            <p>2FA: <code className="bg-dark-elevated px-1 rounded">123456</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
