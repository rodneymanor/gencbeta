# Product Context: Gen C Beta - AI-Powered Content Creation Platform

## Product Vision
Gen C Beta is a comprehensive AI-powered content creation platform designed for social media creators, focusing on script writing, video analysis, and brand development. The platform helps creators generate high-quality content efficiently while maintaining their unique voice and brand identity.

## 🎯 **Complete App Flow & Feature Integration**

### **Core User Journey: From Idea to Published Script**
```
Dashboard → New Script → Speed Write API → A/B Options → Editor → Save/Export
```

#### **1. Content Idea Input → Script Creation**
**Entry Points**: Multiple pathways to script creation
- **Direct Input**: Text ideas on New Script page (`/dashboard/scripts/new`)
- **Video Analysis**: URL input for content inspiration
- **Ghost Writer**: AI-generated ideas based on brand profile
- **Idea Inbox**: Saved ideas from previous sessions
- **Notes Conversion**: Transform research notes into scripts

**AI Processing Flow**:
- Speed Write API generates 2 script options (A/B testing)
- Integrates active voice templates if selected
- Uses brand profile data for personalization
- Credit system enforces usage limits (1 credit per generation)

**Script Selection & Editing**:
- Clean A/B comparison interface
- Standalone Hemingway editor (`/editor/scripts`) with progressive disclosure
- Real-time readability analysis in overlay
- Floating toolbar with AI enhancement tools
- Save/export functionality with keyboard shortcuts

#### **2. Supporting Ecosystem: Brand Intelligence**
```
My Brand → Questionnaire → AI Analysis → Brand Strategy → Influences Everything
```

**Brand Profile Integration**:
- **Ghost Writer**: Uses brand pillars to generate targeted content ideas
- **Voice Creation**: Informs custom voice characteristics
- **Script Generation**: Personalizes content to brand voice
- **Collections**: Organizes research around brand themes

#### **3. Voice System Architecture**
```
Voice Studio → Create from Profile → Video Analysis → Voice Templates → Active Voice
```

**Voice Ecosystem Components**:
- **Voice Library**: Pre-built professional voices (`/dashboard/voices?tab=library`)
- **Custom Voices**: Created from creator profiles (`/dashboard/voices?tab=custom`)
- **Voice Templates**: Hook→Bridge→Golden Nugget→WTA structure
- **Active Voice**: Selected voice influences all content generation

**Voice Creation Process**:
1. Input TikTok/Instagram profile URL
2. AI analyzes 10-200 videos from profile
3. Creates video collection for research
4. Generates voice templates from content patterns
5. Creates custom AI voice (80 credits)

#### **4. Research & Inspiration Layer**
```
Research → Collections → Add Videos → Processing → Transcripts → Voice Training Data
```

**Collections Multi-Purpose System**:
- **Research Organization**: Categorize videos by topic/creator
- **Voice Training**: Automatic collection creation during voice generation
- **Script Inspiration**: Study successful content patterns
- **Team Collaboration**: Share collections with team members

**Ghost Writer AI Ideas**:
```
Brand Profile + Active Voice → AI Cycle → PEQ Framework → 6 Targeted Ideas → Script Creation
```

**Smart Idea Generation Features**:
- Uses Problems, Excuses, Questions (PEQ) framework
- Integrates brand profile for relevance
- Considers active voice templates for feasibility
- 12-hour cycles with fresh ideas
- One-click conversion to scripts

#### **5. Content Capture & Organization**
```
Capture → Notes → Tag & Organize → Convert to Scripts → Full Creation Flow
```

**Flexible Input Methods**:
- Text notes with tagging system
- Voice memos (planned feature)
- Quick idea capture from anywhere
- Research notes from video analysis
- Seamless conversion to script ideas

### **Management & Controls Integration**

#### **Credit System**
- **Script Generation**: 1 credit per generation
- **Voice Training**: 80 credits (analyzing ~100 videos)
- **Video Analysis**: 1 credit per video added to collection
- **Real-time Tracking**: Usage dashboard with limits and reset timers

#### **User Management**
- **Team Collaboration**: Multi-user access and permissions
- **Admin Controls**: User management and role assignment
- **Settings**: API keys, preferences, account management

### **Daily Workflow Examples**

#### **Content Creator Workflow**
1. Check Ghost Writer ideas (influenced by brand profile)
2. Select relevant idea or input new concept
3. Generate A/B script options with active voice
4. Edit in distraction-free Hemingway editor
5. Save to script library or export for production

#### **Research & Development Workflow**
1. Discover inspiring creator on social media
2. Add their videos to research collection
3. Create custom voice from their content style
4. Use new voice in script generation
5. Maintain consistent brand voice across content

#### **Brand Development Workflow**
1. Update brand profile with new insights
2. Refresh Ghost Writer for updated ideas
3. Generate targeted content ideas
4. Create consistent content aligned with brand strategy

## Core Product Goals

### 1. Content Creation Excellence
- **Script Writing**: AI-powered script generation with A/B testing capabilities
- **Voice Consistency**: Maintain creator's unique voice across all content
- **Quality Assurance**: Built-in readability analysis and content optimization
- **Brand Alignment**: Ensure all content aligns with creator's brand pillars

### 2. User Experience Priorities
- **Simplicity First**: Remove complexity and focus on core content creation
- **Distraction-Free**: Minimize UI noise to maximize creative focus
- **Progressive Disclosure**: Advanced features available but not visually prominent
- **Single-Column Focus**: Optimal reading width with centered alignment

### 3. Creator Workflow Optimization
- **Efficient Generation**: Fast script creation with minimal input required
- **Iterative Improvement**: Easy editing and refinement of generated content
- **Multi-Platform Support**: Content optimized for different social platforms
- **Analytics Integration**: Track performance and optimize based on data

## 🎯 **NEW: Minimalistic Single-Column UI Redesign Plan**

### Current State Analysis
The platform currently uses complex multi-column layouts that create visual noise and distract from the core content creation experience:

**Identified Issues:**
- **Complex multi-column layouts**: Dashboard uses sidebar + main content with additional sidebars in editor
- **Visual noise**: Heavy use of borders, shadows, cards, and complex grid layouts
- **Scattered navigation**: Multiple sidebar variants, complex header with many controls
- **Editor complexity**: Split-pane layouts with multiple sidebars (editor, readability, settings)

### Target State: Minimalistic Focus
Transform the platform into a content-first experience with minimal distractions:

**Core Principles:**
- **Single-column canvas**: Centered content with optimal reading width (72ch)
- **Progressive disclosure**: Navigation hidden in drawer, accessed on-demand
- **Visual simplification**: Remove borders/shadows, rely on whitespace for separation
- **Content-first**: Focus on the writing experience with minimal UI distractions

### Key Design Principles

#### 1. Content First
- Writing and content take priority over UI controls
- Maximize screen real estate for actual content
- Remove unnecessary visual elements that don't serve the content

#### 2. Progressive Disclosure
- Complex features available but not visually prominent
- Use drawers and overlays to hide complexity
- Reveal functionality only when needed

#### 3. Whitespace as Design
- Use spacing instead of borders for visual separation
- Create breathing room around content elements
- Rely on typography hierarchy for organization

#### 4. Single Column Focus
- Optimal reading width with centered alignment
- Eliminate multi-column layouts that fragment attention
- Create a focused, linear content experience

#### 5. Minimal Triggers
- Simple icons/buttons that reveal complexity when needed
- Reduce visual weight of interactive elements
- Use subtle hover states and transitions

## User Experience Goals

### Primary User Journey: Script Creation
1. **Idea Input**: Simple, centered input field for script ideas
2. **Generation**: Fast AI processing with minimal loading states
3. **Selection**: Clean A/B comparison interface
4. **Editing**: Distraction-free writing environment
5. **Refinement**: Progressive access to advanced editing tools

### Secondary Workflows
- **Brand Development**: Questionnaire-based brand profile creation
- **Video Analysis**: Simple upload and analysis interface
- **Voice Training**: Streamlined voice creation from content
- **Collections**: Organized content library management

### Success Metrics
- **Reduced Time to First Script**: Minimize steps from idea to first draft
- **Increased Editing Time**: More time spent refining content vs. navigating UI
- **Improved User Satisfaction**: Cleaner, more focused experience
- **Higher Completion Rates**: Simpler workflows lead to more completed tasks

## Technical Requirements

### Performance Goals
- **Fast Load Times**: Minimize initial bundle size
- **Smooth Interactions**: 60fps animations and transitions
- **Responsive Design**: Works seamlessly across all device sizes
- **Accessibility**: Maintain WCAG compliance throughout redesign

### Compatibility Requirements
- **Existing Functionality**: All current features must be preserved
- **Data Integrity**: No loss of user data during transition
- **API Compatibility**: Backend APIs remain unchanged
- **User Preferences**: Maintain user settings and customizations

## Implementation Strategy

### Phase-Based Rollout
1. **Foundation**: Core layout and styling system
2. **Components**: Individual component transformations
3. **Editor**: Script editor redesign (highest priority)
4. **Content Pages**: Dashboard and collection pages
5. **Polish**: Final touches and optimization

### Risk Mitigation
- **Feature Flags**: Gradual rollout with ability to revert
- **User Testing**: Validate each phase with real users
- **Performance Monitoring**: Track metrics throughout transition
- **Feedback Integration**: Continuous improvement based on user input

This redesign represents a fundamental shift toward a more focused, creator-friendly platform that prioritizes content creation over interface complexity. 