#!/usr/bin/env python3
"""
Sincronización completa de dendrita con Supabase
Sincroniza: workspaces, projects, documents, stakeholders, user service configs
"""
import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

try:
    import requests
except ImportError:
    print("❌ Error: requests module not found")
    print("   Install with: pip3 install requests")
    exit(1)


def load_env_file(env_path: str) -> Dict[str, str]:
    """Load .env.local file"""
    env_vars = {}
    if not os.path.exists(env_path):
        return env_vars
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, value = line.split('=', 1)
                env_vars[key.strip()] = value.strip()
    return env_vars


def detect_doc_type(name: str) -> str:
    """Detect document type from filename"""
    name_lower = name.lower()
    if name_lower == 'current-context.md':
        return 'current_context'
    elif name_lower == 'master-plan.md':
        return 'master_plan'
    elif name_lower == 'tasks.md':
        return 'tasks'
    elif name_lower == 'readme.md':
        return 'readme'
    return 'other'


def build_slug(project_code: str, name: str) -> str:
    """Build slug from project code and filename"""
    base = re.sub(r'\.[^.]+$', '', name).lower().replace(' ', '-')
    return f"{project_code}/{base}"


class SupabaseClient:
    """Supabase REST API client for full sync"""
    
    def __init__(self, url: str, anon_key: str, service_role_key: Optional[str] = None):
        self.url = url.rstrip('/')
        self.api_url = f"{self.url}/rest/v1"
        key = service_role_key or anon_key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def _upsert(self, table: str, data: Dict, conflict_cols: List[str]) -> Dict:
        """Generic upsert helper"""
        conflict_str = ','.join(conflict_cols)
        response = requests.post(
            f"{self.api_url}/{table}",
            headers=self.headers,
            json=data
        )
        
        if response.status_code == 409:
            # Build filter for existing record
            filters = '&'.join([f"{col}=eq.{data[col]}" for col in conflict_cols])
            response = requests.get(
                f"{self.api_url}/{table}?{filters}",
                headers=self.headers
            )
            if response.status_code == 200:
                existing = response.json()
                if existing:
                    # Update existing
                    record_id = existing[0]['id']
                    response = requests.patch(
                        f"{self.api_url}/{table}?id=eq.{record_id}",
                        headers={k: v for k, v in self.headers.items() if k != 'Prefer'},
                        json={k: v for k, v in data.items() if k not in conflict_cols}
                    )
                    if response.status_code in (200, 204):
                        return existing[0]
        
        if response.status_code not in (200, 201):
            raise Exception(f"Upsert failed for {table}: {response.status_code} - {response.text}")
        
        result = response.json()
        return result[0] if isinstance(result, list) else result
    
    def upsert_workspace(self, code: str, name: str, description: str, style_config: Dict, metadata: Dict) -> str:
        """Upsert workspace"""
        data = {
            'code': code,
            'name': name,
            'description': description,
            'style_config': style_config,
            'metadata': metadata
        }
        result = self._upsert('workspaces', data, ['code'])
        return result['id']
    
    def upsert_project(self, workspace_id: str, code: str, name: str, status: str, metadata: Dict) -> str:
        """Upsert project"""
        data = {
            'workspace_id': workspace_id,
            'code': code,
            'name': name,
            'status': status,
            'metadata': metadata
        }
        result = self._upsert('projects', data, ['workspace_id', 'code'])
        return result['id']
    
    def upsert_document(self, workspace_id: str, project_id: str, project_code: str, file_info: Dict, content: str) -> str:
        """Upsert document with content"""
        doc_type = detect_doc_type(file_info['file_name'])
        slug = build_slug(project_code, file_info['file_name'])
        
        data = {
            'workspace_id': workspace_id,
            'project_id': project_id,
            'title': file_info['file_name'],
            'slug': slug,
            'doc_type': doc_type,
            'content': content,
            'metadata': {'path': file_info['rel_path'], 'source': 'sync-all', 'synced_at': datetime.now().isoformat()}
        }
        result = self._upsert('documents', data, ['workspace_id', 'slug'])
        return result['id']
    
    def upsert_user_service_config(self, user_id: str, service_name: str, is_configured: bool, metadata: Dict = None) -> str:
        """Upsert user service configuration"""
        data = {
            'user_id': user_id,
            'service_name': service_name,
            'is_configured': is_configured,
            'last_checked': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        result = self._upsert('user_service_configs', data, ['user_id', 'service_name'])
        return result['id']
    
    def upsert_stakeholder(self, workspace_id: str, stakeholder_data: Dict) -> str:
        """Upsert stakeholder from JSON file using unique ID from JSON"""
        # Get unique ID from JSON (aliado-001, aliado-002, etc.)
        stakeholder_json_id = stakeholder_data.get('id') or stakeholder_data.get('nombre_corto', '').lower().replace(' ', '-')
        
        # Extract contact info
        contacts = stakeholder_data.get('contactos', {})
        contact_json = {
            'principal': contacts.get('principal', {}),
            'secundario': contacts.get('secundario')
        }
        
        # Combine metadata with unique ID
        metadata = {
            'source': 'sync-all',
            'synced_at': datetime.now().isoformat(),
            'json_id': stakeholder_json_id,  # Unique identifier from JSON
            'original_data': stakeholder_data
        }
        
        # Use nombre_organizacion or nombre_corto as display name
        display_name = stakeholder_data.get('nombre_organizacion') or stakeholder_data.get('nombre_corto', '')
        
        data = {
            'workspace_id': workspace_id,
            'name': display_name,
            'kind': stakeholder_data.get('tipo_stakeholder', ''),
            'contact': contact_json,
            'metadata': metadata
        }
        
        # Try to match by json_id in metadata (more reliable than name)
        # First, get all stakeholders for this workspace
        response = requests.get(
            f"{self.api_url}/stakeholders?workspace_id=eq.{workspace_id}",
            headers=self.headers
        )
        
        if response.status_code == 200:
            existing = response.json()
            # Find by json_id in metadata
            for existing_stakeholder in existing:
                existing_metadata = existing_stakeholder.get('metadata', {})
                if isinstance(existing_metadata, dict) and existing_metadata.get('json_id') == stakeholder_json_id:
                    # Found existing, update it
                    stakeholder_id = existing_stakeholder['id']
                    response = requests.patch(
                        f"{self.api_url}/stakeholders?id=eq.{stakeholder_id}",
                        headers={k: v for k, v in self.headers.items() if k != 'Prefer'},
                        json={k: v for k, v in data.items() if k != 'workspace_id'}
                    )
                    if response.status_code in (200, 204):
                        return stakeholder_id
        
        # Insert new (no match found by json_id)
        response = requests.post(
            f"{self.api_url}/stakeholders",
            headers=self.headers,
            json=data
        )
        
        if response.status_code not in (200, 201):
            raise Exception(f"Stakeholder upsert failed: {response.status_code} - {response.text}")
        
        result = response.json()
        return (result[0] if isinstance(result, list) else result)['id']


def collect_workspaces(repo_root: Path) -> List[Dict]:
    """Collect all workspace information"""
    workspaces = []
    workspaces_dir = repo_root / 'workspaces'
    
    if not workspaces_dir.exists():
        return workspaces
    
    for ws_dir in workspaces_dir.iterdir():
        if not ws_dir.is_dir() or ws_dir.name == 'template':
            continue
        
        ws_code = ws_dir.name
        config_file = ws_dir / 'config-estilo.json'
        readme_file = ws_dir / 'README.md'
        
        style_config = {}
        description = ws_code
        
        if config_file.exists():
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    style_config = json.load(f)
            except:
                pass
        
        if readme_file.exists():
            try:
                with open(readme_file, 'r', encoding='utf-8') as f:
                    description = f.read()[:200]  # First 200 chars
            except:
                pass
        
        metadata = {
            'path': str(ws_dir.relative_to(repo_root)),
            'has_config': config_file.exists(),
            'has_readme': readme_file.exists()
        }
        
        workspaces.append({
            'code': ws_code,
            'name': ws_code,
            'description': description,
            'style_config': style_config,
            'metadata': metadata,
            'path': str(ws_dir)
        })
    
    return workspaces


def collect_projects(repo_root: Path) -> List[Dict]:
    """Collect all projects (active and archived)"""
    projects = []
    workspaces_dir = repo_root / 'workspaces'
    
    if not workspaces_dir.exists():
        return projects
    
    for ws_dir in workspaces_dir.iterdir():
        if not ws_dir.is_dir() or ws_dir.name == 'template':
            continue
        
        ws_code = ws_dir.name
        
        # Active projects
        active_dir = ws_dir / 'active-projects'
        if active_dir.exists():
            for project_dir in active_dir.iterdir():
                if project_dir.is_dir():
                    projects.append({
                        'workspace_code': ws_code,
                        'code': project_dir.name,
                        'name': project_dir.name.replace('-', ' ').title(),
                        'status': 'active',
                        'path': str(project_dir)
                    })
        
        # Archived projects
        archived_dir = ws_dir / 'archived-projects'
        if archived_dir.exists():
            for project_dir in archived_dir.iterdir():
                if project_dir.is_dir():
                    projects.append({
                        'workspace_code': ws_code,
                        'code': project_dir.name,
                        'name': project_dir.name.replace('-', ' ').title(),
                        'status': 'archived',
                        'path': str(project_dir)
                    })
    
    return projects


def collect_documents(repo_root: Path) -> List[Dict]:
    """Collect all markdown documents from projects"""
    documents = []
    
    for project in collect_projects(repo_root):
        project_path = Path(project['path'])
        if not project_path.exists():
            continue
        
        for md_file in project_path.glob('*.md'):
            rel_path = str(md_file.relative_to(repo_root))
            documents.append({
                'workspace_code': project['workspace_code'],
                'project_code': project['code'],
                'file_path': str(md_file),
                'rel_path': rel_path,
                'file_name': md_file.name
            })
    
    return documents


def collect_stakeholders(repo_root: Path) -> List[Dict]:
    """Collect stakeholders from JSON files"""
    stakeholders = []
    workspaces_dir = repo_root / 'workspaces'
    
    if not workspaces_dir.exists():
        return stakeholders
    
    for ws_dir in workspaces_dir.iterdir():
        if not ws_dir.is_dir():
            continue
        
        ws_code = ws_dir.name
        stakeholders_dir = ws_dir / 'stakeholders' / 'fichas-json'
        
        if not stakeholders_dir.exists():
            continue
        
        for json_file in stakeholders_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    stakeholders.append({
                        'workspace_code': ws_code,
                        'data': data,
                        'file_path': str(json_file)
                    })
            except Exception as e:
                print(f"    ⚠️  Error reading {json_file.name}: {e}")
    
    return stakeholders


def main():
    """Main sync function"""
    repo_root = Path(__file__).parent.parent.parent.parent
    env_path = repo_root / '.dendrita' / '.env.local'
    
    env_vars = load_env_file(str(env_path))
    
    supabase_url = env_vars.get('SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_anon = env_vars.get('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_ANON_KEY')
    supabase_service = env_vars.get('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_anon:
        print("❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY required")
        print(f"   Check: {env_path}")
        exit(1)
    
    print(f"📡 Connecting to Supabase: {supabase_url}")
    client = SupabaseClient(supabase_url, supabase_anon, supabase_service)
    
    print("\n🔄 Starting full synchronization...\n")
    
    # 1. Sync workspaces
    print("📁 Syncing workspaces...")
    workspaces = collect_workspaces(repo_root)
    ws_cache = {}
    for ws in workspaces:
        try:
            ws_id = client.upsert_workspace(
                ws['code'], ws['name'], ws['description'],
                ws['style_config'], ws['metadata']
            )
            ws_cache[ws['code']] = ws_id
            print(f"  ✅ {ws['code']}")
        except Exception as e:
            print(f"  ❌ {ws['code']}: {e}")
    
    # 2. Sync projects
    print(f"\n📦 Syncing projects...")
    projects = collect_projects(repo_root)
    pr_cache = {}
    for pr in projects:
        ws_id = ws_cache.get(pr['workspace_code'])
        if not ws_id:
            continue
        try:
            pr_id = client.upsert_project(
                ws_id, pr['code'], pr['name'], pr['status'],
                {'path': pr['path'], 'source': 'sync-all'}
            )
            pr_cache[f"{pr['workspace_code']}:{pr['code']}"] = pr_id
            print(f"  ✅ {pr['workspace_code']}/{pr['code']} ({pr['status']})")
        except Exception as e:
            print(f"  ❌ {pr['code']}: {e}")
    
    # 3. Sync documents
    print(f"\n📄 Syncing documents...")
    documents = collect_documents(repo_root)
    synced_docs = 0
    for doc in documents:
        ws_id = ws_cache.get(doc['workspace_code'])
        pr_key = f"{doc['workspace_code']}:{doc['project_code']}"
        pr_id = pr_cache.get(pr_key)
        
        if not ws_id or not pr_id:
            continue
        
        try:
            with open(doc['file_path'], 'r', encoding='utf-8') as f:
                content = f.read()
            client.upsert_document(ws_id, pr_id, doc['project_code'], doc, content)
            synced_docs += 1
            if synced_docs % 10 == 0:
                print(f"  ✅ Synced {synced_docs} documents...")
        except Exception as e:
            print(f"  ❌ {doc['file_name']}: {e}")
    
    print(f"  ✅ Total documents synced: {synced_docs}")
    
    # 4. Sync stakeholders
    print(f"\n👥 Syncing stakeholders...")
    stakeholders = collect_stakeholders(repo_root)
    synced_stakeholders = 0
    for sh in stakeholders:
        ws_id = ws_cache.get(sh['workspace_code'])
        if not ws_id:
            continue
        
        try:
            client.upsert_stakeholder(ws_id, sh['data'])
            synced_stakeholders += 1
            print(f"  ✅ {sh['data'].get('nombre_organizacion') or sh['data'].get('nombre_corto', 'Unknown')}")
        except Exception as e:
            print(f"  ❌ {sh['data'].get('nombre_corto', 'Unknown')}: {e}")
    
    print(f"  ✅ Total stakeholders synced: {synced_stakeholders}")
    
    # 5. Sync user service configs
    print(f"\n🔐 Syncing user service configs...")
    try:
        # Detect services from env vars
        services = {
            'google_workspace': bool(env_vars.get('GOOGLE_WORKSPACE_CLIENT_ID')),
            'openai': bool(env_vars.get('OPENAI_API_KEY')),
            'supabase': bool(env_vars.get('SUPABASE_URL')),
            'reddit': bool(env_vars.get('REDDIT_CLIENT_ID')),
        }
        
        # Collect users
        users_dir = repo_root / '.dendrita' / 'users'
        users = []
        if users_dir.exists():
            for user_dir in users_dir.iterdir():
                if user_dir.is_dir() and not user_dir.name.startswith('.'):
                    profile_file = user_dir / 'profile.json'
                    if profile_file.exists():
                        try:
                            with open(profile_file, 'r', encoding='utf-8') as f:
                                profile = json.load(f)
                                users.append(profile.get('user_id', user_dir.name))
                        except:
                            pass
        
        if not users:
            print("  ⚠️  No users found in .dendrita/users/")
        else:
            service_names = {
                'google_workspace': 'Google Workspace',
                'openai': 'OpenAI',
                'supabase': 'Supabase',
                'reddit': 'Reddit',
            }
            
            synced_configs = 0
            for user_id in users:
                for service_key, service_name in service_names.items():
                    is_configured = services.get(service_key, False)
                    try:
                        client.upsert_user_service_config(
                            user_id, service_name, is_configured,
                            {'service_key': service_key, 'source': 'sync-all'}
                        )
                        synced_configs += 1
                    except Exception as e:
                        print(f"  ❌ {user_id}/{service_name}: {e}")
            
            print(f"  ✅ Total service configs synced: {synced_configs}")
    except Exception as e:
        print(f"  ⚠️  Error syncing user service configs: {e}")
        print("     (This is optional and can be fixed later)")
    
    print(f"\n✅ Full sync completed!")
    print(f"   Workspaces: {len(workspaces)}")
    print(f"   Projects: {len(projects)}")
    print(f"   Documents: {synced_docs}")
    print(f"   Stakeholders: {synced_stakeholders}")
    
    # Try to get service configs count if available
    try:
        response = requests.get(
            f"{client.api_url}/user_service_configs?select=id",
            headers=client.headers
        )
        if response.status_code == 200:
            configs = response.json()
            print(f"   User Service Configs: {len(configs)}")
    except:
        pass  # Optional, don't fail if can't count


if __name__ == '__main__':
    main()

