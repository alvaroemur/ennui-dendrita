/**
 * TypeScript types for the unified JSON context system
 * 
 * This file defines the types for:
 * - User context JSON (with quickReference)
 * - Workspace context JSON
 * - Project context JSON
 */

export type MemoryRelevance = 'high' | 'medium' | 'low';
export type MemoryStatus = 'active' | 'archived';
export type ProjectStatus = 'active' | 'paused' | 'completed';

/**
 * Metadata for a memory entry
 */
export interface MemoryMetadata {
  workspace?: string;
  project?: string;
  files: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  relevance: MemoryRelevance;
  status: MemoryStatus;
}

/**
 * A single memory entry
 */
export interface Memory {
  id: string;
  content: string;
  metadata: MemoryMetadata;
}

/**
 * Quick reference entry for recent memory
 */
export interface RecentMemory {
  id: string;
  content: string;
  workspace?: string;
  project?: string;
  updatedAt: string;
}

/**
 * Active workspace information
 */
export interface ActiveWorkspace {
  name: string;
  activeProjects: string[];
  lastActivity: string;
}

/**
 * Recent file information
 */
export interface RecentFile {
  path: string;
  workspace?: string;
  project?: string;
  lastModified: string;
}

/**
 * Quick links to projects
 */
export interface ProjectQuickLink {
  workspace: string;
  path: string;
  contextPath: string;
}

/**
 * Quick links to workspaces
 */
export interface WorkspaceQuickLink {
  contextPath: string;
  activeProjects: number;
}

/**
 * Quick reference section for fast lookup
 */
export interface QuickReference {
  recentMemories: RecentMemory[];
  activeWorkspaces: ActiveWorkspace[];
  recentFiles: RecentFile[];
  recentTags: string[];
  quickLinks: {
    projects: Record<string, ProjectQuickLink>;
    workspaces: Record<string, WorkspaceQuickLink>;
  };
}

/**
 * Summary statistics
 */
export interface ContextSummary {
  totalMemories: number;
  activeMemories: number;
  byWorkspace: Record<string, number>;
  byProject: Record<string, number>;
}

/**
 * User context JSON structure
 */
export interface UserContext {
  lastUpdate: string;
  type: 'user-context';
  quickReference: QuickReference;
  memories: Memory[];
  summary: ContextSummary;
  metadata?: {
    workStatusReport?: {
      path: string;
      generatedAt: string;
      summary: {
        totalProjects: number;
        totalTasks: {
          pending?: number;
          inProgress?: number;
          blocked?: number;
          completed?: number;
        };
      };
    };
  };
}

/**
 * Workspace context JSON structure
 * Similar to user context but filtered by workspace
 */
export interface WorkspaceContext {
  lastUpdate: string;
  type: 'workspace-context';
  workspace: string;
  quickReference: QuickReference;
  memories: Memory[];
  summary: ContextSummary;
}

/**
 * Parsed master plan structure
 */
export interface ParsedMasterPlan {
  executiveSummary?: string;
  phases?: Array<{
    name: string;
    description?: string;
    timeline?: string;
  }>;
  successMetrics?: string[];
  risks?: Array<{
    risk: string;
    mitigation?: string;
  }>;
  rawContent?: string;
}

/**
 * Parsed current context structure
 */
export interface ParsedCurrentContext {
  sessionProgress?: Array<{
    date: string;
    completed: string[];
    inProgress: string[];
    notes?: string[];
  }>;
  currentStatus?: string;
  recentDecisions?: Array<{
    decision: string;
    date: string;
    context?: string;
  }>;
  blockers?: string[];
  nextSteps?: string[];
  rawContent?: string;
}

/**
 * Task entry
 */
export interface Task {
  id?: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  priority?: 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: string;
  notes?: string;
}

/**
 * Parsed tasks structure
 */
export interface ParsedTasks {
  tasks: Task[];
  completed: Task[];
  inProgress: Task[];
  pending: Task[];
  blocked: Task[];
}

/**
 * Project context summary
 */
export interface ProjectContextSummary {
  status: ProjectStatus;
  lastActivity: string;
  tasksCount: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    blocked: number;
  };
}

/**
 * Project context JSON structure
 * Combines master_plan.md, current_context.md, and tasks.md
 */
export interface ProjectContext {
  lastUpdate: string;
  project: string;
  workspace: string;
  masterPlan: ParsedMasterPlan;
  currentContext: ParsedCurrentContext;
  tasks: ParsedTasks;
  quickReference: QuickReference;
  summary: ProjectContextSummary;
}

/**
 * Input from context-input.md/txt
 */
export interface ContextInput {
  ideas?: string[];
  tasks?: string[];
  references?: {
    workspaces?: string[];
    projects?: Array<{ workspace: string; project: string }>;
    files?: string[];
  };
  tags?: string[];
  rawText?: string;
}

