
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class ThreatLSTM(nn.Module):
    """Modèle LSTM pour prédiction d'évolution des menaces"""
    
    def __init__(self, input_size: int = 10, hidden_size: int = 64, num_layers: int = 2, output_size: int = 1):
        super(ThreatLSTM, self).__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True, dropout=0.2)
        self.fc = nn.Linear(hidden_size, output_size)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_size)
        
        out, _ = self.lstm(x, (h0, c0))
        out = self.fc(out[:, -1, :])
        return self.sigmoid(out)

class ThreatAutoencoder(nn.Module):
    """Autoencoder pour détection d'anomalies dans les menaces"""
    
    def __init__(self, input_dim: int = 50, encoding_dim: int = 20):
        super(ThreatAutoencoder, self).__init__()
        
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.ReLU(),
            nn.Linear(32, encoding_dim),
            nn.ReLU()
        )
        
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(encoding_dim, 32),
            nn.ReLU(),
            nn.Linear(32, input_dim),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

class AttentionThreatClassifier(nn.Module):
    """Classifieur avec mécanisme d'attention pour analyse contextuelle"""
    
    def __init__(self, input_dim: int = 768, hidden_dim: int = 256, num_classes: int = 4):
        super(AttentionThreatClassifier, self).__init__()
        
        self.attention = nn.MultiheadAttention(input_dim, num_heads=8, dropout=0.1)
        self.norm1 = nn.LayerNorm(input_dim)
        
        self.classifier = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim // 2, num_classes)
        )
        
    def forward(self, x):
        # x shape: (seq_len, batch, input_dim)
        attn_output, _ = self.attention(x, x, x)
        x = self.norm1(x + attn_output)
        
        # Global average pooling
        x = torch.mean(x, dim=0)
        return self.classifier(x)

class DeepLearningThreatEngine:
    """Moteur principal pour les modèles deep learning"""
    
    def __init__(self, model_path: str = "./models/deep_learning/"):
        self.model_path = model_path
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialiser les modèles
        self.lstm_model = ThreatLSTM()
        self.autoencoder = ThreatAutoencoder()
        self.attention_classifier = AttentionThreatClassifier()
        
        # Charger les modèles pré-entraînés s'ils existent
        self._load_models()
        
    def _load_models(self):
        """Charger les modèles pré-entraînés"""
        try:
            lstm_path = f"{self.model_path}/threat_lstm.pth"
            if os.path.exists(lstm_path):
                self.lstm_model.load_state_dict(torch.load(lstm_path, map_location=self.device))
                logger.info("Modèle LSTM chargé avec succès")
                
            autoencoder_path = f"{self.model_path}/threat_autoencoder.pth"
            if os.path.exists(autoencoder_path):
                self.autoencoder.load_state_dict(torch.load(autoencoder_path, map_location=self.device))
                logger.info("Autoencoder chargé avec succès")
                
            attention_path = f"{self.model_path}/attention_classifier.pth"
            if os.path.exists(attention_path):
                self.attention_classifier.load_state_dict(torch.load(attention_path, map_location=self.device))
                logger.info("Classifieur attention chargé avec succès")
                
        except Exception as e:
            logger.error(f"Erreur lors du chargement des modèles: {str(e)}")
    
    def predict_threat_evolution(self, threat_history: List[Dict]) -> Dict:
        """Prédiction avancée d'évolution des menaces avec LSTM"""
        try:
            # Préparation des données
            features = self._extract_features_from_history(threat_history)
            
            # Conversion en tenseur
            X = torch.FloatTensor(features).unsqueeze(0)  # Add batch dimension
            
            # Prédiction
            self.lstm_model.eval()
            with torch.no_grad():
                prediction = self.lstm_model(X)
                
            return {
                'next_score': float(prediction.item()),
                'confidence': self._calculate_lstm_confidence(features),
                'trend_analysis': self._analyze_deep_trend(features),
                'risk_factors': self._identify_risk_factors(features)
            }
            
        except Exception as e:
            logger.error(f"Erreur prédiction LSTM: {str(e)}")
            return {'next_score': 0.0, 'confidence': 0.0}
    
    def detect_anomalies(self, threat_data: Dict) -> Dict:
        """Détection d'anomalies avec autoencoder"""
        try:
            # Extraction des caractéristiques
            features = self._extract_threat_features(threat_data)
            
            # Conversion en tenseur
            X = torch.FloatTensor(features).unsqueeze(0)
            
            # Reconstruction
            self.autoencoder.eval()
            with torch.no_grad():
                reconstructed = self.autoencoder(X)
                
            # Calcul de l'erreur de reconstruction
            reconstruction_error = torch.mean((X - reconstructed) ** 2).item()
            
            # Seuil d'anomalie (à ajuster selon les données)
            anomaly_threshold = 0.1
            is_anomaly = reconstruction_error > anomaly_threshold
            
            return {
                'is_anomaly': bool(is_anomaly),
                'reconstruction_error': float(reconstruction_error),
                'anomaly_score': min(reconstruction_error / anomaly_threshold, 1.0),
                'explanation': self._explain_anomaly(features, reconstructed.squeeze().numpy())
            }
            
        except Exception as e:
            logger.error(f"Erreur détection anomalies: {str(e)}")
            return {'is_anomaly': False, 'reconstruction_error': 0.0}
    
    def classify_with_attention(self, threat_documents: List[str]) -> Dict:
        """Classification avancée avec mécanisme d'attention"""
        try:
            # Preprocessing des documents (utiliser BERT embeddings)
            from transformers import AutoTokenizer, AutoModel
            
            tokenizer = AutoTokenizer.from_pretrained('bert-base-multilingual-cased')
            model = AutoModel.from_pretrained('bert-base-multilingual-cased')
            
            embeddings = []
            for doc in threat_documents:
                inputs = tokenizer(doc, return_tensors='pt', max_length=512, truncation=True)
                with torch.no_grad():
                    outputs = model(**inputs)
                    embeddings.append(outputs.last_hidden_state.mean(dim=1).squeeze())
            
            # Stack embeddings
            X = torch.stack(embeddings)
            
            # Classification avec attention
            self.attention_classifier.eval()
            with torch.no_grad():
                logits = self.attention_classifier(X)
                probabilities = torch.softmax(logits, dim=-1)
                
            # Mapping des classes
            classes = ['low', 'medium', 'high', 'critical']
            predicted_class = classes[torch.argmax(probabilities).item()]
            
            return {
                'predicted_class': predicted_class,
                'probabilities': {classes[i]: float(probabilities[i]) for i in range(len(classes))},
                'confidence': float(torch.max(probabilities)),
                'attention_weights': self._get_attention_weights(X)
            }
            
        except Exception as e:
            logger.error(f"Erreur classification attention: {str(e)}")
            return {'predicted_class': 'medium', 'confidence': 0.5}
    
    def _extract_features_from_history(self, history: List[Dict]) -> List[List[float]]:
        """Extraction de caractéristiques temporelles"""
        features = []
        for entry in history:
            feature_vector = [
                entry.get('score', 0.0),
                entry.get('confidence', 0.0),
                entry.get('source_credibility', 0.0),
                entry.get('temporal_coherence', 0.0),
                entry.get('network_density', 0.0),
                entry.get('entity_count', 0),
                entry.get('keyword_density', 0.0),
                entry.get('sentiment_score', 0.0),
                entry.get('urgency_level', 0.0),
                entry.get('geographic_risk', 0.0)
            ]
            features.append(feature_vector)
        
        return features
    
    def _extract_threat_features(self, threat_data: Dict) -> List[float]:
        """Extraction de caractéristiques pour l'autoencoder"""
        # Simuler extraction de 50 caractéristiques
        features = []
        
        # Caractéristiques de base
        features.extend([
            threat_data.get('score', 0.0),
            threat_data.get('confidence', 0.0),
            len(threat_data.get('text', '')),
            threat_data.get('source', {}).get('reliability', 0.0),
        ])
        
        # Padding pour atteindre 50 dimensions
        while len(features) < 50:
            features.append(0.0)
            
        return features[:50]
    
    def _calculate_lstm_confidence(self, features: List[List[float]]) -> float:
        """Calcul de confiance pour les prédictions LSTM"""
        if len(features) < 3:
            return 0.3
        
        # Stabilité des données récentes
        recent_scores = [f[0] for f in features[-3:]]
        stability = 1.0 - np.std(recent_scores)
        
        return max(0.1, min(0.9, stability))
    
    def _analyze_deep_trend(self, features: List[List[float]]) -> Dict:
        """Analyse de tendance avancée"""
        if len(features) < 2:
            return {'trend': 'unknown', 'acceleration': 0.0}
        
        scores = [f[0] for f in features]
        
        # Calcul de la dérivée (vitesse de changement)
        velocity = np.diff(scores)
        
        # Calcul de l'accélération
        acceleration = np.diff(velocity) if len(velocity) > 1 else [0.0]
        
        return {
            'trend': 'increasing' if np.mean(velocity) > 0 else 'decreasing',
            'acceleration': float(np.mean(acceleration)),
            'volatility': float(np.std(scores)),
            'momentum': float(np.mean(velocity[-3:]) if len(velocity) >= 3 else 0.0)
        }
    
    def _identify_risk_factors(self, features: List[List[float]]) -> List[str]:
        """Identification des facteurs de risque"""
        risk_factors = []
        
        if len(features) > 0:
            latest = features[-1]
            
            if latest[0] > 0.8:  # Score élevé
                risk_factors.append("Score de menace critique")
            if latest[1] < 0.3:  # Confiance faible
                risk_factors.append("Confiance faible dans l'évaluation")
            if latest[4] > 0.7:  # Densité réseau élevée
                risk_factors.append("Réseau d'acteurs dense")
                
        return risk_factors
    
    def _explain_anomaly(self, original: List[float], reconstructed: List[float]) -> str:
        """Explication des anomalies détectées"""
        max_diff_idx = np.argmax(np.abs(np.array(original) - np.array(reconstructed)))
        
        explanations = {
            0: "Score de menace inhabituel",
            1: "Niveau de confiance anormal",
            2: "Longueur de texte atypique",
            3: "Fiabilité de source suspecte"
        }
        
        return explanations.get(max_diff_idx, "Anomalie dans les caractéristiques")
    
    def _get_attention_weights(self, X: torch.Tensor) -> List[float]:
        """Extraction des poids d'attention pour interprétabilité"""
        # Simplification - en pratique, il faudrait modifier le modèle
        # pour retourner les poids d'attention
        return [0.1, 0.3, 0.4, 0.2]  # Exemple
    
    def save_models(self):
        """Sauvegarder tous les modèles"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            torch.save(self.lstm_model.state_dict(), f"{self.model_path}/threat_lstm.pth")
            torch.save(self.autoencoder.state_dict(), f"{self.model_path}/threat_autoencoder.pth")
            torch.save(self.attention_classifier.state_dict(), f"{self.model_path}/attention_classifier.pth")
            
            logger.info("Modèles deep learning sauvegardés avec succès")
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde modèles: {str(e)}")
