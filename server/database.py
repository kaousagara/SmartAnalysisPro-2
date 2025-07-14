import os
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from typing import Dict, List, Optional

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
        self.init_tables()
    
    def connect(self):
        """Établir la connexion à la base de données PostgreSQL"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('PGHOST'),
                database=os.getenv('PGDATABASE'),
                user=os.getenv('PGUSER'),
                password=os.getenv('PGPASSWORD'),
                port=os.getenv('PGPORT'),
                cursor_factory=RealDictCursor
            )
            self.connection.autocommit = True
            print("Connexion à la base de données établie avec succès")
        except Exception as e:
            print(f"Erreur de connexion à la base de données: {e}")
    
    def init_tables(self):
        """Initialiser les tables nécessaires"""
        try:
            cursor = self.connection.cursor()
            
            # Créer la table users si elle n'existe pas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users_new (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    clearance_level INTEGER DEFAULT 1,
                    name VARCHAR(100),
                    email VARCHAR(100),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Migrer les données existantes si nécessaire
            cursor.execute("""
                INSERT INTO users_new (username, password, clearance_level, name, email)
                SELECT username, password, 
                       COALESCE(clearance_level, 1) as clearance_level,
                       COALESCE(username, 'User') as name,
                       COALESCE(username || '@intel.gov', 'user@intel.gov') as email
                FROM users
                WHERE NOT EXISTS (SELECT 1 FROM users_new WHERE users_new.username = users.username)
            """)
            
            # Remplacer l'ancienne table
            cursor.execute("DROP TABLE IF EXISTS users CASCADE")
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            # Insérer les utilisateurs par défaut s'ils n'existent pas
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()['count']
            
            if user_count == 0:
                default_users = [
                    ('analyst', 'analyst123', 3, 'Analyst J.Smith', 'analyst@intel.gov'),
                    ('admin', 'admin123', 5, 'Admin User', 'admin@intel.gov'),
                    ('operator', 'operator123', 2, 'Opérateur Système', 'operator@intel.gov')
                ]
                
                for username, password, clearance, name, email in default_users:
                    hashed_password = generate_password_hash(password)
                    cursor.execute("""
                        INSERT INTO users (username, password, clearance_level, name, email)
                        VALUES (%s, %s, %s, %s, %s)
                    """, (username, hashed_password, clearance, name, email))
                
                print("Utilisateurs par défaut créés avec succès")
            
            cursor.close()
            
        except Exception as e:
            print(f"Erreur lors de l'initialisation des tables: {e}")
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, password, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE username = %s AND is_active = TRUE
            """, (username,))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Récupérer un utilisateur par ID"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE id = %s AND is_active = TRUE
            """, (user_id,))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None
    
    def get_all_users(self) -> List[Dict]:
        """Récupérer tous les utilisateurs"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE is_active = TRUE
                ORDER BY created_at DESC
            """)
            
            users = cursor.fetchall()
            cursor.close()
            
            return [dict(user) for user in users]
            
        except Exception as e:
            print(f"Erreur lors de la récupération des utilisateurs: {e}")
            return []
    
    def create_user(self, username: str, password: str, clearance_level: int, 
                   name: str, email: str) -> Optional[Dict]:
        """Créer un nouvel utilisateur"""
        try:
            cursor = self.connection.cursor()
            
            # Vérifier si l'utilisateur existe déjà
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                cursor.close()
                return None  # L'utilisateur existe déjà
            
            # Hacher le mot de passe
            hashed_password = generate_password_hash(password)
            
            # Insérer le nouvel utilisateur
            cursor.execute("""
                INSERT INTO users (username, password, clearance_level, name, email)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, clearance_level, name, email, is_active, 
                          created_at, updated_at
            """, (username, hashed_password, clearance_level, name, email))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la création de l'utilisateur: {e}")
            return None
    
    def update_user(self, user_id: int, username: str = None, clearance_level: int = None,
                   name: str = None, email: str = None, is_active: bool = None) -> Optional[Dict]:
        """Mettre à jour un utilisateur"""
        try:
            cursor = self.connection.cursor()
            
            # Construire la requête de mise à jour dynamiquement
            update_fields = []
            values = []
            
            if username is not None:
                update_fields.append("username = %s")
                values.append(username)
            if clearance_level is not None:
                update_fields.append("clearance_level = %s")
                values.append(clearance_level)
            if name is not None:
                update_fields.append("name = %s")
                values.append(name)
            if email is not None:
                update_fields.append("email = %s")
                values.append(email)
            if is_active is not None:
                update_fields.append("is_active = %s")
                values.append(is_active)
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, username, clearance_level, name, email, is_active, 
                          created_at, updated_at
            """
            
            cursor.execute(query, values)
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour de l'utilisateur: {e}")
            return None
    
    def delete_user(self, user_id: int) -> bool:
        """Supprimer un utilisateur (suppression logique)"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                UPDATE users 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (user_id,))
            
            cursor.close()
            return True
            
        except Exception as e:
            print(f"Erreur lors de la suppression de l'utilisateur: {e}")
            return False
    
    def verify_password(self, username: str, password: str) -> Optional[Dict]:
        """Vérifier le mot de passe d'un utilisateur"""
        user = self.get_user_by_username(username)
        if user and check_password_hash(user['password'], password):
            # Retourner les données utilisateur sans le mot de passe
            return {
                'id': user['id'],
                'username': user['username'],
                'clearance_level': user['clearance_level'],
                'name': user['name'],
                'email': user['email']
            }
        return None
    
    def update_password(self, user_id: int, new_password: str) -> bool:
        """Mettre à jour le mot de passe d'un utilisateur"""
        try:
            cursor = self.connection.cursor()
            hashed_password = generate_password_hash(new_password)
            
            cursor.execute("""
                UPDATE users 
                SET password = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (hashed_password, user_id))
            
            cursor.close()
            return True
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour du mot de passe: {e}")
            return False

# Instance globale de la base de données
db = Database()