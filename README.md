# ccresume

A character user interface (CUI) tool for browsing and resuming Claude Code conversations.

![ccresume screenshot](docs/images/demo-screenshot.png)

**⚠️ DISCLAIMER: This is an unofficial third-party tool not affiliated with or endorsed by Anthropic. Use at your own risk.**

## Overview

ccresume provides an interactive terminal interface to browse and manage your Claude Code conversation history. It reads conversation data from your local Claude Code configuration and displays them in an easy-to-navigate format.

### Key Features

- 📋 Browse all Claude Code conversations across projects
- 🔍 View detailed conversation information
- 📎 Copy session IDs to clipboard
- 🚀 Start new Claude sessions in selected project directories
- 📁 Filter conversations to current directory with `.` argument
- 🎭 Hide specific message types for cleaner display

![ccresume demo](docs/images/demo.gif)

## Installation

### Via npx (Recommended)

```bash
npx @sasazame/ccresume@latest
```

### Global Installation

```bash
npm install -g @sasazame/ccresume
```

## Usage

Run the command in your terminal:

```bash
ccresume
```

Or if using npx:

```bash
npx @sasazame/ccresume@latest
```

### Command Line Options

#### ccresume Options

```bash
# Hide specific message types
ccresume --hide              # Default: hides tool and thinking messages
ccresume --hide tool         # Hide only tool messages
ccresume --hide thinking      # Hide only thinking messages
ccresume --hide user         # Hide only user messages
ccresume --hide assistant    # Hide only assistant messages
ccresume --hide tool thinking user  # Hide multiple types

# Filter to current directory
ccresume .

# Show help
ccresume --help
ccresume -h

# Show version
ccresume --version
ccresume -v
```

#### Passing Options to Claude

All unrecognized command-line arguments are passed directly to the `claude` command when resuming a conversation.

```bash
# Pass options to claude
ccresume --dangerously-skip-permissions

# Multiple options
ccresume --model opus --dangerously-skip-permissions

# Combine ccresume and claude options
ccresume --hide tool --model opus 
ccresume . --hide --dangerously-skip-permissions
```

**⚠️ Warning**: Since unrecognized arguments are passed to claude, avoid using options that conflict with ccresume's functionality:
- Don't use options like `--resume` or something like that changes claude's interactive behavior

## Requirements

- **Node.js** >= 18
- **Claude Code** - Must be installed and configured
- **Operating System** - Works on macOS, Linux, and Windows (both native & WSL)

## Keyboard Controls

### Default Key Bindings

| Action | Keys |
|--------|------|
| Quit | `q` |
| Select Previous | `↑` |
| Select Next | `↓` |
| Confirm/Resume | `Enter` |
| Start New Session | `n` |
| Copy Session ID | `c` |
| Scroll Up | `k` |
| Scroll Down | `j` |
| Page Up | `u`, `PageUp` |
| Page Down | `d`, `PageDown` |
| Scroll to Top | `g` |
| Scroll to Bottom | `G` |
| Next Page | `→`|
| Previous Page | `←` |

### Custom Key Bindings

You can customize key bindings by creating a configuration file at `~/.config/ccresume/config.toml`:

```toml
[keybindings]
quit = ["q", "ctrl+c", "esc"]
selectPrevious = ["up", "k"]
selectNext = ["down", "j"]
confirm = ["enter", "l"]
copySessionId = ["y"]
scrollUp = ["u", "ctrl+u"]
scrollDown = ["d", "ctrl+d"]
scrollPageUp = ["b", "ctrl+b"]
scrollPageDown = ["f", "ctrl+f"]
scrollTop = ["g"]
scrollBottom = ["shift+g"]
pageNext = ["right", "n"]
pagePrevious = ["left", "p"]
```

See `config.toml.example` in the repository for a complete example.

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

## License

MIT

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/sasazame/ccresume/issues).

## 🐞 Known Issues

Below are known issues and limitations. Contributions and suggestions are welcome!

| No. | Title | Description | Issue |
|:---:|:------|:-------------|:-----|
| 1 | **Incomplete conversation history restoration on resume** | When resuming with ccresume, sometimes, only the tail end of the history is restored. Although the interactive `claude -r` can restore full history. Workaround: use `claude -r` interactively or `claude -c`. | [#2](https://github.com/sasazame/ccresume/issues/2) |
| 2 | **~~Restore original console state after exiting ccresume~~** | ~~Exiting `ccresume` leaves the chat selection interface visible and hides previous terminal content.~~ **This is fixed in v0.3.1**: Terminal scrollback buffer is now preserved when exiting. | [#3](https://github.com/sasazame/ccresume/issues/3) |
| 3 | **Resume ordering may be incorrect** | For performance issue, `ccresume` sorts logs by file system timestamps (not chat content), so display order may not match actual chronology after migration. Workaround: preserve file timestamps. | – |
| 4 | **Windows native terminal limitations** | On Windows native terminals, interactive features may have limited functionality due to terminal input handling differences. Temporarily, in the Windows native environment, a warning message will be displayed before startup. | [#32](https://github.com/sasazame/ccresume/issues/32) |

Remember: This is an unofficial tool. For official Claude Code support, please refer to Anthropic's documentation.
