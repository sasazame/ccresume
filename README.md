# ccresume

A terminal user interface (TUI) tool for browsing and resuming Claude Code conversations.

**⚠️ DISCLAIMER: This is an unofficial third-party tool not affiliated with or endorsed by Anthropic. Use at your own risk.**

## Overview

ccresume provides an interactive terminal interface to browse and manage your Claude Code conversation history. It reads conversation data from your local Claude Code configuration and displays them in an easy-to-navigate format.

### Key Features

- 📋 Browse all Claude Code conversations across projects
- 🔍 View detailed conversation information
- ⚡ Quick resume functionality with `claude --resume`
- 📎 Copy session IDs to clipboard
- 🎨 Color-coded interface for better readability

## Installation

### Via npx (Recommended)

```bash
npx ccresume@latest
```

### Global Installation

```bash
npm install -g ccresume
```

## Usage

Run the command in your terminal:

```bash
ccresume
```

Or if using npx:

```bash
npx ccresume@latest
```

**Important**: All command-line arguments are passed directly to the `claude` command when resuming a conversation.

### Passing Options to Claude

All command-line arguments are passed directly to the `claude` command:

```bash
# Pass options to claude
ccresume --dangerously-skip-permissions

# Multiple options
ccresume --model claude-3-opus --temperature 0.7
```

**⚠️ Warning**: Since all arguments are passed to claude, avoid using options that conflict with ccresume's functionality:
- Don't use `--resume` (ccresume handles this automatically)
- Don't use options that change claude's interactive behavior

### Keyboard Controls

- **↑/↓** or **j/k** - Navigate through conversations
- **Enter** - Copy session ID to clipboard
- **r** - Resume the selected conversation with `claude --resume`
- **q** or **Esc** - Quit the application

### Conversation Details

Each conversation displays:
- **Project Name** - The name of the project
- **Project Path** - Full path to the project directory
- **Session ID** - Unique identifier for the conversation
- **Start Time** - When the conversation began
- **Duration** - How long the conversation lasted
- **Messages** - Total number of messages exchanged
- **Preview** - First and last messages in the conversation

## Requirements

- **Node.js** >= 16
- **Claude Code** - Must be installed and configured
- **Operating System** - Works on macOS, Linux, and Windows (with WSL)

## How It Works

ccresume reads conversation data from your Claude Code configuration directory:
- **macOS/Linux**: `~/.config/claude/`
- **Windows**: `%APPDATA%\claude\`

The tool parses conversation JSON files and presents them in a user-friendly interface without modifying any data.

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/ccresume.git
cd ccresume

# Install dependencies
npm install
```

### Available Scripts

```bash
# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage

# Run linter
npm run lint

# Type check
npm run typecheck
```

### Project Structure

```
ccresume/
├── src/              # Source code
│   ├── cli.tsx       # CLI entry point
│   ├── App.tsx       # Main application component
│   └── ...           # Other components and utilities
├── dist/             # Compiled output
├── tests/            # Test files
└── package.json      # Project configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

**"Claude Code not found"**
- Ensure Claude Code is installed: `claude --version`
- Check that Claude Code configuration exists in the expected directory

**"No conversations found"**
- Verify you have existing Claude Code conversations
- Check file permissions on the Claude configuration directory

**"Cannot resume conversation"**
- Ensure you're in a git repository
- Verify the conversation ID is valid

## Security Considerations

- ccresume only reads conversation data; it never modifies or deletes files
- No data is sent to external servers
- Conversation content remains local to your machine
- The tool requires the same file system permissions as Claude Code

## Performance Considerations

- ccresume currently loads all conversations on startup
- With a large number of conversations (1000+), initial loading may take a few seconds
- Future improvements may include:
  - Pagination or lazy loading for better performance with large datasets
  - Configurable limits on the number of conversations displayed
  - Caching mechanisms for faster repeated access

## License

MIT

## Acknowledgments

- Built with [Ink](https://github.com/vadimdemedes/ink) for terminal UI
- Uses [React](https://reactjs.org/) for component architecture
- Styled with [Chalk](https://github.com/chalk/chalk) for terminal colors

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/yourusername/ccresume/issues).

Remember: This is an unofficial tool. For official Claude Code support, please refer to Anthropic's documentation.