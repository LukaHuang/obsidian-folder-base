# Folder Base Creator

An Obsidian plugin that allows you to quickly create a base from folder context menu with automatic folder and markdown file filters.

## Features

- Right-click on any folder in the file explorer to create a base
- Automatically filters files in the current folder using `file.inFolder(this.file.folder)`
- Automatically filters for markdown files only (`.md` extension)
- Creates a `.base` file in the selected folder
- Auto-opens the newly created base

## Usage

1. Right-click on any folder in the file explorer
2. Select "Create a base of folder" from the context menu
3. A new `.base` file will be created and opened automatically
4. The base will display all markdown files in the current folder

## Installation

### From Obsidian Community Plugins

1. Open Settings in Obsidian
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Folder Base Creator"
4. Click Install, then Enable

### Manual Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release
2. Create a folder named `folder-base` in your vault's `.obsidian/plugins/` directory
3. Copy the downloaded files into the folder
4. Reload Obsidian
5. Enable the plugin in Settings → Community Plugins

## Base File Format

The plugin creates a base with the following structure:

```yaml
filters:
  and:
    - file.inFolder(this.file.folder)
    - file.ext == "md"

properties:
  file.name:
    displayName: "Name"
  file.mtime:
    displayName: "Modified"

views:
  - type: table
    name: "Files in current folder"
    order:
      - file.name
```

## Requirements

- Obsidian v0.15.0 or higher
- Bases core plugin enabled

## Development

### Running Tests

This plugin includes comprehensive unit tests using Jest.

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

## Support

If you encounter any issues or have suggestions, please create an issue on [GitHub](https://github.com/YOUR_USERNAME/obsidian-folder-base/issues).

## License

MIT
