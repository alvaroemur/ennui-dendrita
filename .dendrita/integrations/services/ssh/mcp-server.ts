#!/usr/bin/env node

/**
 * Servidor MCP para SSH
 * Expone herramientas SSH para uso desde Cursor y otros clientes MCP
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SSHClientService } from './client';
import { SSHAuth } from './auth';
import { SSHScraperHelper } from './scraper-helper';
import { createLogger } from '../../utils/logger';
import * as fs from 'fs';

const logger = createLogger('MCPServer');

class SSHMCPServer {
  private server: Server;
  private sshClient: SSHClientService;
  private scraperHelper: SSHScraperHelper;

  constructor() {
    this.server = new Server(
      {
        name: 'ssh-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.sshClient = new SSHClientService();
    this.scraperHelper = new SSHScraperHelper();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Listar herramientas disponibles
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ssh_execute_command',
            description: 'Ejecutar un comando en un servidor remoto vía SSH',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                command: {
                  type: 'string',
                  description: 'Comando a ejecutar en el servidor remoto',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout en milisegundos (opcional, default: 30000)',
                  default: 30000,
                },
              },
              required: ['host', 'command'],
            },
          },
          {
            name: 'ssh_list_hosts',
            description: 'Listar todos los hosts SSH configurados',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'ssh_create_tunnel',
            description: 'Crear un túnel SSH (port forwarding)',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                localPort: {
                  type: 'number',
                  description: 'Puerto local para el túnel',
                },
                remoteHost: {
                  type: 'string',
                  description: 'Host remoto al que conectar',
                },
                remotePort: {
                  type: 'number',
                  description: 'Puerto remoto al que conectar',
                },
              },
              required: ['host', 'localPort', 'remoteHost', 'remotePort'],
            },
          },
          {
            name: 'ssh_deploy_file',
            description: 'Deployar un archivo a un servidor remoto',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                localPath: {
                  type: 'string',
                  description: 'Path local del archivo a deployar',
                },
                remotePath: {
                  type: 'string',
                  description: 'Path remoto donde deployar el archivo',
                },
              },
              required: ['host', 'localPath', 'remotePath'],
            },
          },
          {
            name: 'ssh_check_service',
            description: 'Verificar estado de un servicio en servidor remoto',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                service: {
                  type: 'string',
                  description: 'Nombre del servicio a verificar',
                },
                checkType: {
                  type: 'string',
                  description: 'Tipo de verificación: process, logs, status',
                  enum: ['process', 'logs', 'status'],
                  default: 'process',
                },
              },
              required: ['host', 'service'],
            },
          },
          {
            name: 'ssh_run_scraper',
            description: 'Ejecutar un scraper remotamente',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                scraper: {
                  type: 'string',
                  description: 'Tipo de scraper a ejecutar',
                  enum: ['gmail-scraper', 'calendar-scraper', 'drive-scraper'],
                },
                userId: {
                  type: 'string',
                  description: 'ID del usuario',
                },
                profileId: {
                  type: 'string',
                  description: 'ID del perfil (opcional)',
                },
                configName: {
                  type: 'string',
                  description: 'Nombre de la configuración (opcional)',
                },
                workspace: {
                  type: 'string',
                  description: 'Nombre del workspace (opcional, para drive-scraper)',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout en milisegundos (opcional, default: 300000)',
                  default: 300000,
                },
              },
              required: ['host', 'scraper', 'userId'],
            },
          },
          {
            name: 'ssh_view_logs',
            description: 'Ver logs remotos',
            inputSchema: {
              type: 'object',
              properties: {
                host: {
                  type: 'string',
                  description: 'Nombre del host SSH configurado',
                },
                logPath: {
                  type: 'string',
                  description: 'Path del archivo de log en el servidor remoto',
                },
                lines: {
                  type: 'number',
                  description: 'Número de líneas a leer (opcional, default: 50)',
                  default: 50,
                },
                filter: {
                  type: 'string',
                  description: 'Filtro para buscar en los logs (opcional)',
                },
              },
              required: ['host', 'logPath'],
            },
          },
        ],
      };
    });

    // Ejecutar herramientas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ssh_execute_command':
            return await this.handleExecuteCommand(args as any);

          case 'ssh_list_hosts':
            return await this.handleListHosts();

          case 'ssh_create_tunnel':
            return await this.handleCreateTunnel(args as any);

          case 'ssh_deploy_file':
            return await this.handleDeployFile(args as any);

          case 'ssh_check_service':
            return await this.handleCheckService(args as any);

          case 'ssh_run_scraper':
            return await this.handleRunScraper(args as any);

          case 'ssh_view_logs':
            return await this.handleViewLogs(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Error executing tool ${name}`, error);
        
        // Errores más específicos
        if (error instanceof Error) {
          if (error.message.includes('not configured')) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Configuration error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          if (error.message.includes('Failed to connect') || error.message.includes('Connection')) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Connection error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          if (error.message.includes('Permission denied') || error.message.includes('Authentication')) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Authentication error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
          if (error.message.includes('Invalid') || error.message.includes('not found')) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Validation error: ${error.message}`,
                },
              ],
              isError: true,
            };
          }
        }
        
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleExecuteCommand(args: { host: string; command: string; timeout?: number }) {
    const result = await this.sshClient.executeCommand(args.host, args.command, args.timeout);
    return {
      content: [
        {
          type: 'text',
          text: `Exit Code: ${result.code}\n\nStdout:\n${result.stdout}\n\nStderr:\n${result.stderr}`,
        },
      ],
    };
  }

  private async handleListHosts() {
    const hosts = SSHAuth.listHosts();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(hosts, null, 2),
        },
      ],
    };
  }

  private async handleCreateTunnel(args: {
    host: string;
    localPort: number;
    remoteHost: string;
    remotePort: number;
  }) {
    await this.sshClient.createTunnel(args.host, {
      localPort: args.localPort,
      remoteHost: args.remoteHost,
      remotePort: args.remotePort,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Tunnel created successfully. Local port: ${args.localPort} -> Remote: ${args.remoteHost}:${args.remotePort}\n\nNote: Tunnel will remain active until connection closes.`,
        },
      ],
    };
  }

  private async handleDeployFile(args: { host: string; localPath: string; remotePath: string }) {
    // Validar que el archivo local existe
    if (!fs.existsSync(args.localPath)) {
      throw new Error(`Local file not found: ${args.localPath}`);
    }

    // Validar que el path remoto es seguro
    if (args.remotePath.includes('..') || args.remotePath.startsWith('/etc')) {
      throw new Error('Invalid remote path: paths with ".." or starting with "/etc" are not allowed');
    }

    await this.sshClient.deployFile(args.host, args.localPath, args.remotePath);
    return {
      content: [
        {
          type: 'text',
          text: `File deployed successfully: ${args.localPath} -> ${args.remotePath}`,
        },
      ],
    };
  }

  private async handleCheckService(args: {
    host: string;
    service: string;
    checkType?: string;
  }) {
    let result: string;

    if (args.checkType === 'process') {
      const command = `ps aux | grep -i "${args.service}" | grep -v grep`;
      const execResult = await this.sshClient.executeCommand(args.host, command);
      result = execResult.stdout || 'Service not running';
    } else if (args.checkType === 'logs') {
      const command = `tail -n 50 /var/log/${args.service}.log 2>/dev/null || echo "Log file not found"`;
      const execResult = await this.sshClient.executeCommand(args.host, command);
      result = execResult.stdout || execResult.stderr;
    } else {
      // status - usar scraper helper si es un scraper
      if (args.service.includes('scraper')) {
        const status = await this.scraperHelper.checkScraperStatus(args.host, args.service);
        result = JSON.stringify(status, null, 2);
      } else {
        const command = `systemctl status ${args.service} 2>&1 || service ${args.service} status 2>&1 || echo "Service status check failed"`;
        const execResult = await this.sshClient.executeCommand(args.host, command);
        result = execResult.stdout || execResult.stderr;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  private async handleRunScraper(args: {
    host: string;
    scraper: 'gmail-scraper' | 'calendar-scraper' | 'drive-scraper';
    userId: string;
    profileId?: string;
    configName?: string;
    workspace?: string;
    timeout?: number;
  }) {
    const result = await this.scraperHelper.runScraper({
      host: args.host,
      scraper: args.scraper,
      user_id: args.userId,
      profile_id: args.profileId,
      config_name: args.configName,
      workspace: args.workspace,
      timeout: args.timeout,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Success: ${result.success}\nExit Code: ${result.exitCode}\n\nStdout:\n${result.stdout}\n\nStderr:\n${result.stderr}${result.error ? `\n\nError: ${result.error}` : ''}`,
        },
      ],
    };
  }

  private async handleViewLogs(args: {
    host: string;
    logPath: string;
    lines?: number;
    filter?: string;
  }) {
    // Validar que el path del log es seguro
    if (args.logPath.includes('..') || args.logPath.startsWith('/etc')) {
      throw new Error('Invalid log path: paths with ".." or starting with "/etc" are not allowed');
    }

    // Validar número de líneas
    const lines = args.lines || 50;
    if (lines < 1 || lines > 1000) {
      throw new Error('Invalid lines parameter: must be between 1 and 1000');
    }

    let command = `tail -n ${lines} ${args.logPath}`;
    if (args.filter) {
      // Escapar el filtro para evitar inyección de comandos
      const escapedFilter = args.filter.replace(/[;&|`$(){}[\]<>]/g, '');
      command = `tail -n ${lines} ${args.logPath} | grep -i "${escapedFilter}"`;
    }

    const result = await this.sshClient.executeCommand(args.host, command);
    return {
      content: [
        {
          type: 'text',
          text: result.stdout || result.stderr || 'No logs found',
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('SSH MCP Server started');
  }
}

// Ejecutar servidor si se llama directamente
if (require.main === module) {
  const server = new SSHMCPServer();
  server.run().catch((error) => {
    logger.error('Failed to start MCP server', error);
    process.exit(1);
  });
}

export { SSHMCPServer };

