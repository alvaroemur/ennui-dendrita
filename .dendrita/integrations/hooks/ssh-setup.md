---
name: ssh-setup
description: "SSH Setup"
type: documentation
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["documentation", "integration"]
category: integration
---

# 🔐 SSH Setup

Configura SSH en dendrita sin exponer claves.

---

## Requisitos

- Clave privada SSH (o path a clave privada)
- Configuración de hosts SSH (opcional, puedes usar archivo SSH config)
- Acceso a servidores remotos

---

## Variables en `.dendrita/.env.local`

Ejemplo (reemplaza con tus datos):

```env
# SSH - Clave privada global (opcional)
SSH_PRIVATE_KEY_PATH=~/.ssh/id_rsa
# O usar contenido de clave directamente (no recomendado)
# SSH_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# SSH - Configuración de hosts específicos
SSH_HOST_DEV_SERVER_NAME=dev-server
SSH_HOST_DEV_SERVER_HOST=192.168.1.100
SSH_HOST_DEV_SERVER_USER=alvaro
SSH_HOST_DEV_SERVER_PORT=22
SSH_HOST_DEV_SERVER_PRIVATE_KEY_PATH=~/.ssh/id_rsa

# SSH - Otro host
SSH_HOST_GCP_BASTION_NAME=gcp-bastion
SSH_HOST_GCP_BASTION_HOST=35.123.45.67
SSH_HOST_GCP_BASTION_USER=alvaro
SSH_HOST_GCP_BASTION_PORT=22
SSH_HOST_GCP_BASTION_PRIVATE_KEY_PATH=~/.ssh/gcp-key

# SSH - Usar archivo SSH config (opcional)
SSH_CONFIG_PATH=~/.ssh/config
```

Notas importantes:
- `.env.local` está en `.gitignore` → nunca se comitea
- Preferir `SSH_PRIVATE_KEY_PATH` sobre `SSH_PRIVATE_KEY` (más seguro)
- Si usas `SSH_CONFIG_PATH`, el sistema parseará tu archivo `~/.ssh/config` automáticamente

---

## Configuración de Hosts

### Opción 1: Variables de Entorno

Para cada host, define:
- `SSH_HOST_[NAME]_NAME` - Nombre del host (ej: `dev-server`)
- `SSH_HOST_[NAME]_HOST` - IP o hostname
- `SSH_HOST_[NAME]_USER` - Usuario SSH
- `SSH_HOST_[NAME]_PORT` - Puerto (opcional, default: 22)
- `SSH_HOST_[NAME]_PRIVATE_KEY_PATH` - Path a clave privada (opcional, usa global si no se especifica)

Ejemplo:
```env
SSH_HOST_DEV_SERVER_NAME=dev-server
SSH_HOST_DEV_SERVER_HOST=192.168.1.100
SSH_HOST_DEV_SERVER_USER=alvaro
SSH_HOST_DEV_SERVER_PORT=22
SSH_HOST_DEV_SERVER_PRIVATE_KEY_PATH=~/.ssh/id_rsa
```

### Opción 2: Archivo SSH Config

Usa tu archivo `~/.ssh/config` existente:

```env
SSH_CONFIG_PATH=~/.ssh/config
```

El sistema parseará tu archivo SSH config automáticamente. Ejemplo de `~/.ssh/config`:

```
Host dev-server
    Hostname 192.168.1.100
    User alvaro
    Port 22
    IdentityFile ~/.ssh/id_rsa

Host gcp-bastion
    Hostname 35.123.45.67
    User alvaro
    Port 22
    IdentityFile ~/.ssh/gcp-key
```

---

## Uso del Servicio SSH

En código, usa el servicio incluido:

```ts
import { SSHClientService } from './.dendrita/integrations/services/ssh/client';
import { SSHAuth } from './.dendrita/integrations/services/ssh/auth';

// Verificar si SSH está configurado
if (!SSHAuth.isConfigured()) {
  throw new Error('SSH not configured');
}

// Listar hosts configurados
const hosts = SSHAuth.listHosts();
console.log('Available hosts:', hosts);

// Ejecutar comando remoto
const client = new SSHClientService();
const result = await client.executeCommand('dev-server', 'ls -la');
console.log('Stdout:', result.stdout);
console.log('Stderr:', result.stderr);
console.log('Exit Code:', result.code);
```

---

## Ejemplo Rápido

```ts
import { SSHClientService } from './.dendrita/integrations/services/ssh/client';

const client = new SSHClientService();

// Ejecutar comando
const result = await client.executeCommand('dev-server', 'echo "Hello from remote!"');
console.log(result.stdout);

// Deploy archivo
await client.deployFile(
  'dev-server',
  './local-file.txt',
  '/app/dendrita/remote-file.txt'
);

// Crear túnel SSH
const closeTunnel = await client.createTunnel('dev-server', {
  localPort: 5432,
  remoteHost: 'db.supabase.co',
  remotePort: 5432
});

// ... usar túnel ...
// Cerrar túnel cuando termines
closeTunnel();
```

---

## Ejecutar Scrapers Remotamente

```ts
import { SSHScraperHelper } from './.dendrita/integrations/services/ssh/scraper-helper';

const helper = new SSHScraperHelper();

// Ejecutar scraper de Gmail
const result = await helper.runScraper({
  host: 'dev-server',
  scraper: 'gmail-scraper',
  user_id: 'alvaro',
  profile_id: 'profile-1',
  config_name: 'ennui-gmail-scraper'
});

console.log('Success:', result.success);
console.log('Stdout:', result.stdout);
```

---

## Servidor MCP

El servidor MCP expone herramientas SSH para uso desde Cursor y otros clientes MCP.

### Ejecutar Servidor MCP

```bash
cd .dendrita/integrations
npm run mcp-server
```

### Herramientas Disponibles

- `ssh_execute_command` - Ejecutar comandos remotos
- `ssh_list_hosts` - Listar hosts configurados
- `ssh_create_tunnel` - Crear túnel SSH (port forwarding)
- `ssh_deploy_file` - Deployar archivos a servidor remoto
- `ssh_check_service` - Verificar estado de servicios
- `ssh_run_scraper` - Ejecutar scraper remotamente
- `ssh_view_logs` - Ver logs remotos

---

## Seguridad

- ❌ Nunca hardcodees claves privadas
- ✅ Usa `.env.local` o variables de entorno del sistema
- ✅ Preferir paths de archivos sobre contenido de claves
- ✅ Usa permisos restrictivos en archivos de clave (`chmod 600 ~/.ssh/id_rsa`)
- ✅ Revisa logs; información sensible se redacta automáticamente

---

## Troubleshooting

- "SSH not configured": falta `SSH_PRIVATE_KEY` o `SSH_PRIVATE_KEY_PATH`
- "SSH host 'xxx' not configured": falta configuración del host específico
- "Failed to connect": verifica host, puerto, usuario y clave privada
- "Permission denied": verifica permisos de clave privada (`chmod 600 ~/.ssh/id_rsa`)
- "Command timeout": aumenta timeout o verifica conectividad

---

## Casos de Uso

### 1. Ejecutar Scrapers Remotamente

```ts
const helper = new SSHScraperHelper();
await helper.runScraper({
  host: 'dev-server',
  scraper: 'gmail-scraper',
  user_id: 'alvaro'
});
```

### 2. Deploy de Archivos

```ts
const client = new SSHClientService();
await client.deployFile(
  'dev-server',
  '.dendrita/integrations/services/google/gmail-scraper.ts',
  '/app/dendrita/.dendrita/integrations/services/google/gmail-scraper.ts'
);
```

### 3. Crear Túnel SSH

```ts
const client = new SSHClientService();
const closeTunnel = await client.createTunnel('dev-server', {
  localPort: 5432,
  remoteHost: 'db.supabase.co',
  remotePort: 5432
});

// Ahora puedes conectar a Supabase vía localhost:5432
// ...

// Cerrar túnel
closeTunnel();
```

### 4. Verificar Estado de Servicios

```ts
const helper = new SSHScraperHelper();
const status = await helper.checkScraperStatus('dev-server', 'gmail-scraper');
console.log('Is Running:', status.isRunning);
console.log('Last Execution:', status.lastExecution);
```

---

## Referencias

- [SSH Client Service](../services/ssh/client.ts)
- [SSH Auth Service](../services/ssh/auth.ts)
- [SSH Scraper Helper](../services/ssh/scraper-helper.ts)
- [MCP Server](../services/ssh/mcp-server.ts)

