/**
 * Model Selector Utility
 * 
 * Utility for selecting appropriate language models based on task complexity and cost.
 * Implements tiered model strategy: expensive models for complex tasks, cheap models for simple tasks.
 */

export type TaskType = 
  | 'first-enrichment'
  | 'multi-source-unification'
  | 'complex-analysis'
  | 'structured-extraction'
  | 'standard-processing'
  | 'simple-interpretation'
  | 'formatting'
  | 'classification'
  | 'summarization'
  | 'translation'
  | 'text-normalization'
  | 'simple-analysis';

export type ModelProvider = 'openai' | 'anthropic';

export type ModelTier = 'tier1' | 'tier2' | 'tier3';

interface ModelConfig {
  tier1: string;  // Expensive - high quality
  tier2: string;  // Mid-range - balanced
  tier3: string;  // Cheap - cost-effective
}

const MODEL_CONFIGS: Record<ModelProvider, ModelConfig> = {
  openai: {
    tier1: 'gpt-4-turbo',      // Expensive - high quality
    tier2: 'gpt-4o-mini',      // Mid-range - balanced (recommended default)
    tier3: 'gpt-3.5-turbo',    // Cheap - cost-effective
  },
  anthropic: {
    tier1: 'claude-3-5-sonnet', // Expensive - high quality
    tier2: 'claude-3-sonnet',    // Mid-range - balanced
    tier3: 'claude-3-haiku',     // Cheap - cost-effective
  },
};

/**
 * Determines the appropriate tier for a task type
 */
function getTierForTask(taskType: TaskType): ModelTier {
  // Tier 1: Expensive models for complex tasks
  const tier1Tasks: TaskType[] = [
    'first-enrichment',
    'multi-source-unification',
    'complex-analysis',
    'structured-extraction',
  ];
  
  // Tier 3: Cheap models for simple tasks
  const tier3Tasks: TaskType[] = [
    'simple-interpretation',
    'formatting',
    'classification',
    'summarization',
    'translation',
    'simple-analysis',
  ];
  
  // Tier 2: Balanced models for standard tasks
  const tier2Tasks: TaskType[] = [
    'standard-processing',
    'text-normalization',
  ];

  if (tier1Tasks.includes(taskType)) return 'tier1';
  if (tier3Tasks.includes(taskType)) return 'tier3';
  if (tier2Tasks.includes(taskType)) return 'tier2';
  return 'tier2'; // Default to tier2
}

/**
 * Selects the appropriate model for a task type
 * 
 * @param taskType - Type of task to perform
 * @param provider - Model provider (default: 'openai')
 * @returns Model name to use
 * 
 * @example
 * ```typescript
 * // First-time enrichment - use expensive model
 * const model = selectModel('first-enrichment'); // → 'gpt-4-turbo'
 * 
 * // Simple interpretation - use cheap model
 * const model = selectModel('simple-interpretation'); // → 'gpt-3.5-turbo'
 * 
 * // Standard processing - use balanced model
 * const model = selectModel('standard-processing'); // → 'gpt-4o-mini'
 * ```
 */
export function selectModel(
  taskType: TaskType,
  provider: ModelProvider = 'openai'
): string {
  const tier = getTierForTask(taskType);
  return MODEL_CONFIGS[provider][tier];
}

/**
 * Gets the tier for a task type (useful for logging)
 */
export function getTier(taskType: TaskType): ModelTier {
  return getTierForTask(taskType);
}

/**
 * Gets model information including tier and cost category
 */
export function getModelInfo(
  taskType: TaskType,
  provider: ModelProvider = 'openai'
): {
  model: string;
  tier: ModelTier;
  costCategory: 'expensive' | 'balanced' | 'cheap';
  description: string;
} {
  const tier = getTierForTask(taskType);
  const model = MODEL_CONFIGS[provider][tier];
  
  const costCategories: Record<ModelTier, 'expensive' | 'balanced' | 'cheap'> = {
    tier1: 'expensive',
    tier2: 'balanced',
    tier3: 'cheap',
  };

  const descriptions: Record<ModelTier, string> = {
    tier1: 'High quality model for complex tasks',
    tier2: 'Balanced model for standard tasks',
    tier3: 'Cost-effective model for simple tasks',
  };

  return {
    model,
    tier,
    costCategory: costCategories[tier],
    description: descriptions[tier],
  };
}

/**
 * Checks if a task should use an expensive model
 */
export function shouldUseExpensiveModel(taskType: TaskType): boolean {
  return getTierForTask(taskType) === 'tier1';
}

/**
 * Checks if a task should use a cheap model
 */
export function shouldUseCheapModel(taskType: TaskType): boolean {
  return getTierForTask(taskType) === 'tier3';
}

/**
 * Gets all available models for a provider
 */
export function getAvailableModels(provider: ModelProvider): ModelConfig {
  return MODEL_CONFIGS[provider];
}

