---
name: model-tier-strategy
description: "Model Tier Strategy Hook"
type: hook
created:
  2025-11-06T00:00:00.000Z
  
updated:
  2025-11-06T00:00:00.000Z
  
tags: ["hook", "behavior-reference", "cost-optimization"]
category: behavior-reference
---

# Model Tier Strategy Hook

Behavior reference for Cursor - strategic use of language models based on task complexity and cost.

---

## What is this Hook?

This hook documents the expected behavior that Cursor must apply when selecting language models for different types of tasks, optimizing for cost while maintaining quality.

**Purpose:** Use more expensive models for complex tasks that require high-quality output, and cheaper models for simple tasks that don't require advanced reasoning.

**Context:** Language model costs vary significantly. This hook ensures we use the right model for each task type, balancing cost and quality.

---

## Expected Behavior

### 1. Activation of the Hook

Cursor must apply model-tier-strategy behavior when:

- ✅ Using language models for any task (OpenAI, Claude, etc.)
- ✅ Enriching documents with AI analysis
- ✅ Unifying multiple sources of information
- ✅ Generating interpretations or summaries
- ✅ Processing transcripts or meeting notes
- ✅ Any task that involves AI language model calls

**Activation condition:**

```markdown
IF (task involves language model API call) OR
   (enriching document with AI) OR
   (unifying multiple sources) OR
   (generating interpretation from fragment)
THEN apply model-tier-strategy behavior
```

### 2. Model Tier Selection

When model-tier-strategy behavior is activated, Cursor must:

#### Step 1: Classify Task Complexity

Determine the complexity and requirements of the task:

1. **High Complexity Tasks (Use Expensive Models):**
   - **First-time enrichment:** First time enriching a document with AI analysis
   - **Multi-source unification:** Combining information from multiple sources
   - **Complex analysis:** Deep analysis requiring reasoning and synthesis
   - **Structured extraction:** Extracting structured data from unstructured content
   - **Decision-making:** Tasks that require understanding context and making decisions
   - **Quality-critical:** Tasks where output quality is critical

2. **Low Complexity Tasks (Use Cheap Models):**
   - **Simple interpretation:** Small interpretation from a fragment
   - **Formatting:** Simple formatting or reformatting tasks
   - **Summarization:** Basic summarization of short content
   - **Classification:** Simple classification or tagging
   - **Translation:** Direct translation without context analysis
   - **Repetitive tasks:** Tasks that follow a clear pattern

#### Step 2: Select Appropriate Model

Based on task classification, select the appropriate model tier:

**Tier 1: Expensive Models (High Quality)**
- **OpenAI:** `gpt-4-turbo`, `gpt-4`, `gpt-4o`
- **Anthropic:** `claude-3-opus`, `claude-3-5-sonnet`
- **Use for:**
  - First-time document enrichment
  - Multi-source unification
  - Complex analysis and reasoning
  - Structured data extraction
  - Quality-critical outputs

**Tier 2: Mid-Range Models (Balanced)**
- **OpenAI:** `gpt-4o-mini`, `gpt-3.5-turbo`
- **Anthropic:** `claude-3-haiku`, `claude-3-sonnet`
- **Use for:**
  - Standard document processing
  - Moderate complexity tasks
  - When cost is a concern but quality still matters

**Tier 3: Cheap Models (Cost-Effective)**
- **OpenAI:** `gpt-3.5-turbo` (for very simple tasks)
- **Anthropic:** `claude-3-haiku`
- **Use for:**
  - Simple interpretations from fragments
  - Basic formatting
  - Simple classification
  - Repetitive pattern-based tasks

#### Step 3: Apply Model Selection

When making API calls:

1. **Check task complexity:**
   - Is this first-time enrichment? → Use Tier 1
   - Is this multi-source unification? → Use Tier 1
   - Is this a simple interpretation? → Use Tier 3
   - Is this a standard task? → Use Tier 2

2. **Select model:**
   - Use model selection utility (see below)
   - Default to Tier 2 if uncertain
   - Prefer cheaper models when quality requirements are low

3. **Document model choice:**
   - Log which model was used and why
   - Include in task metadata if applicable

### 3. Task Type Examples

#### High Complexity (Tier 1 - Expensive)

**First-time enrichment:**
```typescript
// First time enriching a meeting notes document
const model = selectModel('first-enrichment'); // → gpt-4-turbo
await enrichDocument(document, { model });
```

**Multi-source unification:**
```typescript
// Combining information from multiple sources
const model = selectModel('multi-source-unification'); // → gpt-4-turbo
await unifySources([source1, source2, source3], { model });
```

**Complex analysis:**
```typescript
// Deep analysis requiring reasoning
const model = selectModel('complex-analysis'); // → gpt-4-turbo
await analyzeTranscript(transcript, { model });
```

#### Low Complexity (Tier 3 - Cheap)

**Simple interpretation:**
```typescript
// Small interpretation from a fragment
const model = selectModel('simple-interpretation'); // → gpt-4o-mini
await interpretFragment(fragment, { model });
```

**Basic formatting:**
```typescript
// Simple formatting task
const model = selectModel('formatting'); // → gpt-4o-mini
await formatContent(content, { model });
```

**Simple classification:**
```typescript
// Basic classification
const model = selectModel('classification'); // → gpt-4o-mini
await classifyItem(item, { model });
```

### 4. Model Selection Utility

Create a utility function for model selection:

```typescript
type TaskType = 
  | 'first-enrichment'
  | 'multi-source-unification'
  | 'complex-analysis'
  | 'structured-extraction'
  | 'standard-processing'
  | 'simple-interpretation'
  | 'formatting'
  | 'classification';

function selectModel(taskType: TaskType, provider: 'openai' | 'anthropic' = 'openai'): string {
  const models = {
    openai: {
      tier1: 'gpt-4-turbo',      // Expensive - high quality
      tier2: 'gpt-4o-mini',      // Mid-range - balanced
      tier3: 'gpt-3.5-turbo',    // Cheap - cost-effective
    },
    anthropic: {
      tier1: 'claude-3-5-sonnet', // Expensive - high quality
      tier2: 'claude-3-sonnet',    // Mid-range - balanced
      tier3: 'claude-3-haiku',     // Cheap - cost-effective
    },
  };

  const tier = getTierForTask(taskType);
  return models[provider][tier];
}

function getTierForTask(taskType: TaskType): 'tier1' | 'tier2' | 'tier3' {
  const tier1Tasks: TaskType[] = [
    'first-enrichment',
    'multi-source-unification',
    'complex-analysis',
    'structured-extraction',
  ];
  
  const tier3Tasks: TaskType[] = [
    'simple-interpretation',
    'formatting',
    'classification',
  ];

  if (tier1Tasks.includes(taskType)) return 'tier1';
  if (tier3Tasks.includes(taskType)) return 'tier3';
  return 'tier2'; // Default to tier2 for standard-processing
}
```

### 5. Cost Optimization Guidelines

**General Rules:**

1. **Start with cheaper models:**
   - Default to Tier 2 (mid-range) for unknown tasks
   - Only upgrade to Tier 1 if quality is insufficient
   - Use Tier 3 for clearly simple tasks

2. **Upgrade when needed:**
   - If Tier 2 output quality is insufficient, retry with Tier 1
   - Track which tasks require Tier 1 for future reference
   - Learn from patterns to optimize model selection

3. **Batch simple tasks:**
   - Group simple tasks and process with Tier 3
   - Use Tier 1 for complex tasks that require individual attention

4. **Monitor costs:**
   - Log model usage and costs
   - Track which tasks use which models
   - Optimize based on actual usage patterns

### 6. Integration with Existing Scripts

**Update existing scripts to use model selection:**

1. **analyze-transcript.ts:**
   - First-time analysis → Tier 1 (gpt-4-turbo)
   - Re-analysis or updates → Tier 2 (gpt-4o-mini)

2. **integrate-transcript-analysis.ts:**
   - Multi-source unification → Tier 1 (gpt-4-turbo)
   - Simple integration → Tier 2 (gpt-4o-mini)

3. **enrich-meeting-notes.ts:**
   - First enrichment → Tier 1 (gpt-4-turbo)
   - Updates → Tier 2 (gpt-4o-mini)

4. **Simple interpretation tasks:**
   - Always use Tier 3 (gpt-4o-mini or gpt-3.5-turbo)

---

## Model Tier Reference

### OpenAI Models

**Tier 1 (Expensive - High Quality):**
- `gpt-4-turbo` - Best quality, highest cost
- `gpt-4` - High quality, expensive
- `gpt-4o` - Latest high-quality model

**Tier 2 (Mid-Range - Balanced):**
- `gpt-4o-mini` - Good quality, reasonable cost (recommended default)
- `gpt-3.5-turbo` - Decent quality, low cost

**Tier 3 (Cheap - Cost-Effective):**
- `gpt-3.5-turbo` - For very simple tasks
- `gpt-4o-mini` - Can be used for simple tasks too

### Anthropic Models

**Tier 1 (Expensive - High Quality):**
- `claude-3-5-sonnet` - Best quality, highest cost
- `claude-3-opus` - High quality, expensive

**Tier 2 (Mid-Range - Balanced):**
- `claude-3-sonnet` - Good quality, reasonable cost
- `claude-3-haiku` - Decent quality, low cost

**Tier 3 (Cheap - Cost-Effective):**
- `claude-3-haiku` - For simple tasks

---

## Implementation Guidelines

### For Cursor:

1. **When enriching documents:**
   - First-time enrichment → Use Tier 1
   - Updates or modifications → Use Tier 2
   - Simple formatting → Use Tier 3

2. **When unifying sources:**
   - Multiple sources → Use Tier 1
   - Single source processing → Use Tier 2

3. **When interpreting fragments:**
   - Small interpretation → Use Tier 3
   - Complex interpretation → Use Tier 2 or Tier 1

4. **Always consider:**
   - Task complexity
   - Quality requirements
   - Cost constraints
   - Historical patterns (what worked before)

### For Scripts:

1. **Use model selection utility:**
   - Import `selectModel` function
   - Pass task type to get appropriate model
   - Log model choice for tracking

2. **Default to Tier 2:**
   - When uncertain, use Tier 2 (balanced)
   - Upgrade if quality insufficient
   - Downgrade if task is clearly simple

3. **Document model choices:**
   - Log which model was used
   - Include reasoning in logs
   - Track cost implications

---

## Notes

- **This hook is a behavior reference:** Cursor should read this to understand expected behavior
- **Cost optimization is important:** Balance quality and cost based on task requirements
- **Learn from patterns:** Track which models work best for which tasks
- **Default to balanced:** When uncertain, use Tier 2 models
- **Upgrade when needed:** Don't hesitate to use Tier 1 for critical tasks

---

**For Cursor:**
- Read this file to understand the logic
- Apply documented behavior when using language models
- Use model selection utility when available
- Consider cost and quality trade-offs for each task

**Related documentation:**
- `.dendrita/integrations/scripts/pipelines/transcripts-pipeline/analyze/analyze-transcript.ts` - Transcript analysis (uses model selection)
- `.dendrita/integrations/scripts/pipelines/transcripts-pipeline/analyze/enrich-meeting-notes.ts` - Meeting notes enrichment
- `.dendrita/integrations/services/openai/chat.ts` - OpenAI service

