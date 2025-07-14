# Storybook Documentation

This project uses Storybook to document and showcase UI components. Storybook provides an isolated environment to develop and test components independently.

## Getting Started

### Installation

Storybook is already installed and configured in this project. To start Storybook:

```bash
npm run storybook
```

This will start the Storybook development server, typically at `http://localhost:6006`.

### Building for Production

To build Storybook for production deployment:

```bash
npm run build-storybook
```

## Configuration

### Global Styles

Storybook is configured to import your global styles from `src/app/globals.css`. This ensures that all components in Storybook use the same styling as your main application.

### Component Paths

Storybook is configured to find stories in:

- `src/**/*.stories.@(js|jsx|mjs|ts|tsx)` - All story files
- `src/**/*.mdx` - Documentation files

### Aliases

The following path aliases are configured in Storybook:

- `@` → `/src`
- `@/components` → `/src/components`
- `@/lib` → `/src/lib`
- `@/hooks` → `/src/hooks`
- `@/contexts` → `/src/contexts`
- `@/types` → `/src/types`
- `@/config` → `/src/config`
- `@/data` → `/src/data`
- `@/server` → `/src/server`
- `@/middleware` → `/src/middleware`
- `@/navigation` → `/src/navigation`

## Creating Stories

### Basic Story Structure

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { YourComponent } from "./YourComponent";

const meta: Meta<typeof YourComponent> = {
  title: "Category/ComponentName",
  component: YourComponent,
  parameters: {
    layout: "centered", // or 'padded', 'fullscreen'
  },
  tags: ["autodocs"], // Enables automatic documentation
  argTypes: {
    // Define controls for your component props
    variant: {
      control: { type: "select" },
      options: ["default", "secondary", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};
```

### Story Categories

Organize your stories using categories:

- **UI/** - Basic UI components (Button, Card, Input, etc.)
- **Common/** - Reusable business components (ActionCard, etc.)
- **Research/** - Research-specific components (VideoInsightsTabs, etc.)
- **Dashboard/** - Dashboard-specific components
- **Forms/** - Form-related components
- **Layout/** - Layout components

### Story Parameters

Common parameters you can use:

```tsx
parameters: {
  layout: 'centered', // Centers the component
  layout: 'padded',   // Adds padding around the component
  layout: 'fullscreen', // Full screen layout

  // Viewport for responsive testing
  viewport: {
    defaultViewport: 'mobile1',
  },

  // Background colors
  backgrounds: {
    default: 'light',
    values: [
      { name: 'light', value: '#ffffff' },
      { name: 'dark', value: '#000000' },
    ],
  },
}
```

### Controls

Define interactive controls for your component props:

```tsx
argTypes: {
  variant: {
    control: { type: 'select' },
    options: ['default', 'secondary', 'destructive'],
  },
  size: {
    control: { type: 'radio' },
    options: ['sm', 'md', 'lg'],
  },
  disabled: {
    control: { type: 'boolean' },
  },
  children: {
    control: { type: 'text' },
  },
}
```

## Available Stories

### UI Components

- **Button** (`src/components/ui/button.stories.tsx`)

  - All variants (default, secondary, destructive, outline, ghost, link)
  - All sizes (sm, default, lg, icon)
  - With icons and disabled states

- **Card** (`src/components/ui/card.stories.tsx`)
  - Default card with header, content, and footer
  - Cards with images
  - Simple cards with just content
  - Header-only and footer-only cards

### Common Components

- **ActionCard** (`src/components/common/ActionCard/ActionCard.stories.tsx`)
  - Default action card
  - Compact layout
  - Without card wrapper
  - Loading states
  - Multiple actions

### Research Components

- **VideoInsightsTabs** (`src/app/(main)/research/collections/_components/video-insights-tabs.stories.tsx`)
  - Default video insights view
  - With copied field states
  - High engagement metrics
  - Instagram vs TikTok platforms

## Best Practices

### 1. Component Documentation

Use the `autodocs` tag to automatically generate documentation:

```tsx
const meta: Meta<typeof YourComponent> = {
  title: "Category/ComponentName",
  component: YourComponent,
  tags: ["autodocs"], // This enables automatic documentation
};
```

### 2. Story Organization

- Use descriptive story names
- Group related stories together
- Use categories to organize components
- Keep stories focused on specific use cases

### 3. Props and Controls

- Define `argTypes` for all important props
- Use appropriate control types (select, radio, boolean, text)
- Provide meaningful default values

### 4. Testing Different States

Create stories for:

- Default state
- Different variants/props
- Loading states
- Error states
- Empty states
- Edge cases

### 5. Responsive Testing

Use viewport controls to test responsive behavior:

```tsx
parameters: {
  viewport: {
    viewports: {
      mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' } },
      tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
      desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' } },
    },
  },
}
```

## Addons

This project includes several Storybook addons:

- **@storybook/addon-docs** - Automatic documentation generation
- **@storybook/addon-a11y** - Accessibility testing
- **@storybook/addon-vitest** - Unit testing integration
- **@chromatic-com/storybook** - Visual testing (if configured)

## Troubleshooting

### Common Issues

1. **Styles not loading**: Ensure `globals.css` is imported in `.storybook/preview.ts`
2. **Aliases not working**: Check the alias configuration in `.storybook/main.ts`
3. **Components not found**: Verify the component path and import statements

### Getting Help

- Check the [Storybook documentation](https://storybook.js.org/docs)
- Review existing stories in the project for examples
- Use the Storybook UI to explore components and their documentation

## Contributing

When adding new components:

1. Create a story file alongside your component
2. Include all major variants and states
3. Add proper documentation and controls
4. Test the story in different viewports
5. Ensure accessibility compliance

## Deployment

Storybook can be deployed to various platforms:

- **Vercel**: Connect your repository and Storybook will build automatically
- **Netlify**: Configure build command as `npm run build-storybook`
- **GitHub Pages**: Use the `storybook-to-ghpages` package

Example Vercel configuration:

```json
{
  "buildCommand": "npm run build-storybook",
  "outputDirectory": "storybook-static",
  "installCommand": "npm install"
}
```
