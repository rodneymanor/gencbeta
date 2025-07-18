# Script Generation Migration Status

## Overview

Migrating from a tightly-coupled script generation system to a modular, maintainable architecture.

## Target Architecture

```mermaid
graph TB
    %% Input Layer - Centralized Configuration
    subgraph "Input Configuration Layer"
        subgraph "Core Inputs"
            CI[Input Schema<br/>- content: string<br/>- metadata: object]
        end
        subgraph "Processing Rules"
            PR1[Duration Rules<br/>Platform-specific]
            PR2[Type Rules<br/>Extensible templates]
            PR3[Tone Rules<br/>Voice mappings]
        end
        subgraph "Context Providers"
            CP1[User Context<br/>- Profile<br/>- Preferences<br/>- History]
            CP2[Brand Context<br/>- Voice<br/>- Style Guide<br/>- Keywords]
            CP3[Platform Context<br/>- Requirements<br/>- Best Practices<br/>- Trends]
        end
    end

    %% Processing Pipeline
    subgraph "Processing Pipeline"
        subgraph "Pre-processors"
            PP1[Input Validator]
            PP2[Context Enricher]
            PP3[Rule Engine]
        end
        subgraph "Content Generators"
            CG1[Hook Generator<br/>Template-based]
            CG2[Script Generator<br/>Formula-based]
            CG3[Ghost Writer<br/>AI-based]
        end
        subgraph "Post-processors"
            PO1[Format Optimizer]
            PO2[Platform Adapter]
            PO3[Quality Checker]
        end
    end

    %% Output Layer
    subgraph "Output Layer"
        OL1[Unified Script Model]
        OL2[Platform Variants]
        OL3[Analytics Data]
    end

    %% Flow
    CI --> PP1
    PR1 --> PP3
    PR2 --> PP3
    PR3 --> PP3
    CP1 --> PP2
    CP2 --> PP2
    CP3 --> PP2
    PP1 --> PP2
    PP2 --> PP3
    PP3 --> CG1
    PP3 --> CG2
    PP3 --> CG3
    CG1 --> PO1
    CG2 --> PO1
    CG3 --> PO1
    PO1 --> PO2
    PO2 --> PO3
    PO3 --> OL1
    OL1 --> OL2
    OL1 --> OL3

    classDef input fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    classDef process fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px
    classDef output fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px

    class CI,PR1,PR2,PR3,CP1,CP2,CP3 input
    class PP1,PP2,PP3,CG1,CG2,CG3,PO1,PO2,PO3 process
    class OL1,OL2,OL3 output
```

## Migration Progress

### ✅ Phase 1: Input Configuration Layer (COMPLETED)

**Implemented Components:**

1. **Core Input Schema** (`UnifiedScriptInput`)

   - Clean, unified input structure
   - No platform-specific logic
   - Type-safe interfaces

2. **Processing Rules**

   - Duration configuration centralized
   - Type definitions (speed, educational, viral)
   - Tone mappings (casual, professional, etc.)

3. **Context Providers**
   - User context with caching
   - Voice profile loading
   - Negative keywords support

**Key Files:**

- `/src/lib/script-generation/types.ts` - Unified types
- `/src/lib/script-generation/context-provider.ts` - Context caching
- `/src/lib/script-generation/duration-config.ts` - Duration rules
- `/src/lib/script-generation/unified-service.ts` - Main service

### 🚧 Phase 2: Processing Pipeline (IN PROGRESS)

**Next Implementation Tasks:**

#### Pre-processors (Not Started)

1. **Input Validator**

   - Schema validation
   - Business rule validation
   - Security checks

2. **Context Enricher**

   - Merge user/brand/platform contexts
   - Apply defaults
   - Handle overrides

3. **Rule Engine**
   - Apply duration rules
   - Select appropriate templates
   - Configure generation parameters

#### Content Generators (Partially Started)

1. **Hook Generator**

   - Template-based generation
   - Multiple hook styles
   - A/B testing support

2. **Script Generator**

   - Formula-based approach
   - Structured content blocks
   - Word count management

3. **Ghost Writer**
   - AI-powered generation
   - Context-aware content
   - Style adaptation

#### Post-processors (Not Started)

1. **Format Optimizer**

   - Clean output formatting
   - Remove redundancies
   - Ensure readability

2. **Platform Adapter**

   - Platform-specific formatting
   - Character limits
   - Special requirements

3. **Quality Checker**
   - Word count validation
   - Negative keyword filtering
   - Content quality metrics

### 📋 Phase 3: Output Layer (PLANNED)

1. **Unified Script Model**

   - Consistent output structure
   - Metadata enrichment
   - Version tracking

2. **Platform Variants**

   - Instagram optimization
   - TikTok formatting
   - YouTube Shorts adaptation

3. **Analytics Data**
   - Performance metrics
   - Usage patterns
   - Quality scores

## Benefits of New Architecture

1. **Modularity**: Each component has a single responsibility
2. **Extensibility**: Easy to add new generators, rules, or processors
3. **Maintainability**: Clear separation of concerns
4. **Testability**: Each component can be tested in isolation
5. **Debuggability**: Clear data flow makes issues easier to trace

## Current Testing

The test page at `/dashboard/test/script-generation` allows comparison between:

- V1: Original tightly-coupled system
- V2: New modular architecture (Phase 1 completed)

Performance improvements observed:

- Reduced database calls through caching
- Faster response times
- More consistent output quality
