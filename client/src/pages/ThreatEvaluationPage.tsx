import React from 'react';
import ThreatEvaluationDemo from '@/components/ThreatEvaluationDemo';

const ThreatEvaluationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Système de Réévaluation des Menaces
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Testez le système de réévaluation automatique des menaces, prédictions et prescriptions basé sur le clustering des documents.
            </p>
          </div>
          
          <ThreatEvaluationDemo />
        </div>
      </div>
    </div>
  );
};

export default ThreatEvaluationPage;