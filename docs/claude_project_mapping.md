# Claude Project Directory Mapping

## Overview

Claude stores conversation files in `~/.claude/projects/` using a specific directory naming pattern that maps to actual project paths.

## Directory Naming Pattern

Claude creates directory names by replacing certain characters in the absolute path with hyphens (`-`).

### Transformation Rules:

1. **Forward Slash**: `/` → `-`
   - Example: `/home/user/git/cc-resume` → `-home-user-git-cc-resume`

2. **Dot**: `.` → `-`
   - Example: `/home/user/.dotfiles` → `-home-user--dotfiles`
   - Note: This creates double hyphens when a dot follows a slash

3. **Edge Cases**:
   - Paths containing hyphens are preserved, which can lead to consecutive hyphens
   - Example: `/home/user/my-project` → `-home-user-my-project`

## Implementation

### Path to Directory Name

```bash
# Convert a path to Claude's directory name format
path_to_claude_dir() {
    echo "$1" | sed 's/[/.]/-/g'
}

# Example usage:
path_to_claude_dir "/home/user/git/cc-resume"
# Output: -home-user-git-cc-resume

path_to_claude_dir "/home/user/.dotfiles"
# Output: -home-user--dotfiles
```

In JavaScript/TypeScript:
```typescript
function pathToClaudeDir(path: string): string {
  return path.replace(/[/.]/g, '-');
}
```

### Directory Name to Path (Reverse)

```bash
# Convert Claude's directory name back to path
# WARNING: This transformation is NOT reversible!
# Multiple different paths can map to the same directory name
# For example: 
#   /home/user/.config → -home-user--config
#   /home/user/-config → -home-user--config
# Both produce the same directory name, making reverse mapping ambiguous
```

## Filtering Conversations by Current Directory

To filter conversations for the current directory without reading conversation files:

```bash
# Get the Claude project directory name for the current path
current_dir=$(pwd)
claude_dir=$(echo "$current_dir" | sed 's/[/.]/-/g')
project_path="$HOME/.claude/projects/$claude_dir"

# Check if conversations exist for current directory
if [ -d "$project_path" ]; then
    echo "Found conversations in: $project_path"
    ls -la "$project_path"/*.jsonl 2>/dev/null
else
    echo "No conversations found for current directory"
fi
```

## Examples

| Actual Path | Claude Directory Name |
|------------|---------------------|
| `/home/user` | `-home-user` |
| `/home/user/git` | `-home-user-git` |
| `/home/user/git/cc-resume` | `-home-user-git-cc-resume` |
| `/home/user/.dotfiles` | `-home-user--dotfiles` |
| `/home/user/playground-20250610` | `-home-user-playground-20250610` |

## Performance Implications

Understanding this mapping is crucial for performance optimization in tools like ccresume:

1. **Without directory filtering**: Must read all conversation files to check their `projectPath`
2. **With directory filtering**: Can skip entire directories at the file system level

For example, if you have 1000 conversations across 50 projects but only 30 in the current directory:
- Without optimization: Reads 1000 files
- With optimization: Reads only 30 files from the matching directory

## Notes

- The transformation is **not reversible** due to both `/` and `.` mapping to `-`
- All conversation files for a project are stored as `.jsonl` files within the project directory
- Each `.jsonl` file is named with a UUID (e.g., `6b983a59-1103-4657-89fd-b32c30ebe875.jsonl`)
- There is no separate metadata file mapping directory names to paths - the mapping is done through the naming convention itself