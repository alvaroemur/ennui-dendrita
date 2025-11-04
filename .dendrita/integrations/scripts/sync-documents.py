#!/usr/bin/env python3
"""
Sync workspace documents to Supabase
Uses Supabase REST API directly
"""
import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional

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


def collect_project_files(repo_root: str) -> List[Dict]:
    """Collect all .md files from active-projects"""
    files = []
    workspaces_dir = Path(repo_root) / 'workspaces'
    
    if not workspaces_dir.exists():
        return files
    
    for workspace_dir in workspaces_dir.iterdir():
        if not workspace_dir.is_dir() or workspace_dir.name == 'template':
            continue
        
        workspace_code = workspace_dir.name
        projects_dir = workspace_dir / 'active-projects'
        
        if not projects_dir.exists():
            continue
        
        for project_dir in projects_dir.iterdir():
            if not project_dir.is_dir():
                continue
            
            project_code = project_dir.name
            
            for md_file in project_dir.glob('*.md'):
                rel_path = str(md_file.relative_to(repo_root))
                files.append({
                    'workspace_code': workspace_code,
                    'project_code': project_code,
                    'file_path': str(md_file),
                    'rel_path': rel_path,
                    'file_name': md_file.name
                })
    
    return files


class SupabaseClient:
    """Simple Supabase REST API client"""
    
    def __init__(self, url: str, anon_key: str, service_role_key: Optional[str] = None):
        self.url = url.rstrip('/')
        self.api_url = f"{self.url}/rest/v1"
        self.headers = {
            'apikey': service_role_key or anon_key,
            'Authorization': f'Bearer {service_role_key or anon_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def upsert_workspace(self, code: str) -> str:
        """Upsert workspace and return ID"""
        response = requests.post(
            f"{self.api_url}/workspaces",
            headers=self.headers,
            json={
                'code': code,
                'name': code,
                'description': 'Imported from filesystem',
                'metadata': {'source': 'sync-script'}
            }
        )
        
        if response.status_code == 409:  # Conflict - exists
            # Get existing
            response = requests.get(
                f"{self.api_url}/workspaces?code=eq.{code}",
                headers=self.headers
            )
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]['id']
        
        if response.status_code not in (200, 201):
            raise Exception(f"Workspace upsert failed: {response.status_code} - {response.text}")
        
        data = response.json()
        if isinstance(data, list):
            return data[0]['id']
        return data['id']
    
    def upsert_project(self, workspace_id: str, code: str) -> str:
        """Upsert project and return ID"""
        response = requests.post(
            f"{self.api_url}/projects",
            headers=self.headers,
            json={
                'workspace_id': workspace_id,
                'code': code,
                'name': code,
                'status': 'active',
                'metadata': {'source': 'sync-script'}
            }
        )
        
        if response.status_code == 409:  # Conflict
            # Get existing
            response = requests.get(
                f"{self.api_url}/projects?workspace_id=eq.{workspace_id}&code=eq.{code}",
                headers=self.headers
            )
            if response.status_code == 200:
                data = response.json()
                if data:
                    return data[0]['id']
        
        if response.status_code not in (200, 201):
            raise Exception(f"Project upsert failed: {response.status_code} - {response.text}")
        
        data = response.json()
        if isinstance(data, list):
            return data[0]['id']
        return data['id']
    
    def upsert_document(self, workspace_id: str, project_id: str, project_code: str, file_info: Dict):
        """Upsert document with content"""
        with open(file_info['file_path'], 'r', encoding='utf-8') as f:
            content = f.read()
        
        doc_type = detect_doc_type(file_info['file_name'])
        slug = build_slug(project_code, file_info['file_name'])
        
        response = requests.post(
            f"{self.api_url}/documents",
            headers=self.headers,
            json={
                'workspace_id': workspace_id,
                'project_id': project_id,
                'title': file_info['file_name'],
                'slug': slug,
                'doc_type': doc_type,
                'content': content,
                'metadata': {'path': file_info['rel_path'], 'source': 'sync-script'}
            }
        )
        
        if response.status_code == 409:  # Conflict - update instead
            # Update existing
            response = requests.patch(
                f"{self.api_url}/documents?workspace_id=eq.{workspace_id}&slug=eq.{slug}",
                headers=self.headers,
                json={
                    'title': file_info['file_name'],
                    'doc_type': doc_type,
                    'content': content,
                    'metadata': {'path': file_info['rel_path'], 'source': 'sync-script'}
                }
            )
        
        if response.status_code not in (200, 201, 204):
            raise Exception(f"Document upsert failed: {response.status_code} - {response.text}")


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
    
    print("📂 Scanning workspaces...")
    files = collect_project_files(str(repo_root))
    
    if not files:
        print("⚠️  No markdown files found to sync")
        return
    
    print(f"📄 Found {len(files)} documents to sync")
    
    # Cache workspace and project IDs
    ws_cache = {}
    pr_cache = {}
    synced = 0
    
    for file_info in files:
        ws_code = file_info['workspace_code']
        pr_code = file_info['project_code']
        
        # Get workspace ID
        if ws_code not in ws_cache:
            print(f"  📁 Workspace: {ws_code}")
            ws_cache[ws_code] = client.upsert_workspace(ws_code)
        
        ws_id = ws_cache[ws_code]
        
        # Get project ID
        pr_key = f"{ws_code}:{pr_code}"
        if pr_key not in pr_cache:
            print(f"    📦 Project: {pr_code}")
            pr_cache[pr_key] = client.upsert_project(ws_id, pr_code)
        
        pr_id = pr_cache[pr_key]
        
        # Upsert document
        try:
            client.upsert_document(ws_id, pr_id, pr_code, file_info)
            synced += 1
            if synced % 10 == 0:
                print(f"    ✅ Synced {synced} documents...")
        except Exception as e:
            print(f"    ❌ Error syncing {file_info['file_name']}: {e}")
    
    print(f"\n✅ Sync completed! Total documents synced: {synced}")


if __name__ == '__main__':
    main()

