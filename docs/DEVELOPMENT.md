# Development Guide

## Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension

## Development Workflow

1. Make changes to the source code
2. Run `npm run build` to build the extension
3. Load the extension from the `dist/` folder in Chrome's extension page
4. Test your changes

## Testing

Run tests with:

```bash
npm test
```

### Test Coverage

To run tests with coverage:

```bash
npm run test:coverage
```

## Code Structure

The codebase follows SOLID principles:

- **Single Responsibility Principle**: Each file has a single responsibility
- **Open/Closed Principle**: Code is open for extension but closed for modification
- **Liskov Substitution Principle**: Subtypes must be substitutable for their base types
- **Interface Segregation Principle**: Clients should not depend on interfaces they don't use
- **Dependency Inversion Principle**: Depend on abstractions, not concretions

## Adding New Commands

To add a new command:

1. Identify the appropriate handler file in `src/commands/`
2. Add a new handler function
3. Update the command processor to recognize the new command
4. Add tests for the new command

## Chrome API Usage

The extension uses a Chrome API abstraction layer in `src/utils/chrome-api.js`. When using Chrome APIs:

1. Add the API to the abstraction layer if it doesn't exist
2. Use the abstraction layer instead of directly calling Chrome APIs
3. This improves testability by allowing for easy mocking

## Building for Production

To build the extension for production:

```bash
npm run build
```

The built extension will be in the `dist/` folder.

## Common Issues

### Navigation History

The extension tracks navigation history for each tab to enable back/forward navigation. If you're having issues with navigation:

1. Check that `trackNavigation` is being called when navigating
2. Verify that `getNavigationHistory` returns the expected history
3. Ensure that `createNavigationHandler` is using the history correctly

### Content Script Injection

If content scripts are not being injected:

1. Check the manifest.json to ensure content scripts are configured correctly
2. Verify that the content script is being built correctly
3. Check for errors in the console 