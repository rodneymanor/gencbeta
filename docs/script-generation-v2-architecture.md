# Script Generation V2 Architecture

## System Overview

```mermaid
graph LR
    subgraph "Input Layer"
        I1[Core Input<br/>- Idea/Content<br/>- Duration<br/>- Type<br/>- Tone]
        I2[User Context<br/>- Voice Profile<br/>- Negative Keywords<br/>- Preferences]
    end

    subgraph "Processing Core"
        PC1[Input Processor<br/>- Validation<br/>- Context Loading]
        PC2[Script Engine<br/>- Duration Rules<br/>- Word Count Logic<br/>- Structure Templates]
        PC3[Output Formatter<br/>- Final Structure<br/>- Metadata]
    end

    subgraph "Generators"
        G1[Hook Generator]
        G2[Content Generator]
        G3[Ghost Writer]
    end

    I1 --> PC1
    I2 --> PC1
    PC1 --> PC2
    PC2 --> G1
    PC2 --> G2
    PC2 --> G3
    G1 --> PC3
    G2 --> PC3
    G3 --> PC3

    classDef input fill:#e3f2fd,stroke:#1565c0
    classDef process fill:#f3e5f5,stroke:#6a1b9a
    classDef generator fill:#e8f5e9,stroke:#2e7d32

    class I1,I2 input
    class PC1,PC2,PC3 process
    class G1,G2,G3 generator
```

## Architecture Components

### Input Layer

- **Core Input**: Essential script generation parameters including idea/content, duration, type, and tone
- **User Context**: Personalization data including voice profile, negative keywords, and user preferences

### Processing Core

- **Input Processor**: Validates inputs and loads contextual data
- **Script Engine**: Applies duration rules, word count logic, and structure templates
- **Output Formatter**: Formats the final script structure with metadata

### Generators

- **Hook Generator**: Creates engaging opening hooks
- **Content Generator**: Produces main script content
- **Ghost Writer**: Handles AI-powered content generation

## Key Features

1. **Unified Input Schema**: Removes platform-specific logic
2. **Context Caching**: Reduces database calls
3. **Centralized Duration Configuration**: Consistent timing across all script types
4. **Modular Architecture**: Easy maintenance and extensibility
