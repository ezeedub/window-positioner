# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GNOME Shell window positioning system consisting of:
- **GNOME Shell Extension** (`extension.js`) - Provides D-Bus interface for window manipulation
- **Command-line Tool** (`position`) - User-facing script for capturing and positioning windows
- **Setup Script** (`setup`) - Deployment tool for installing to system locations

## Development Workflow

### Key Commands
- `./position <command>` - Test the CLI tool locally during development
- `./setup` - Deploy changes to system locations (`/home/ed/bin/` and extension directory)
- `gnome-extensions enable window-positioner` - Enable the extension after setup
- `journalctl --user -f --grep="WindowPositioner"` - Monitor extension logs for debugging

### Extension Updates
When there are changes to `extension.js`, after running `./setup`, the user logout and log back in 
for the extension changes to take effect. The setup command will report this requirement. This 
doesn't apply for changes to the setup or position scripts.

### Architecture

The system uses a hybrid approach:
1. **Extension** exports D-Bus methods at `/org/gnome/Shell/WindowPositioner`
2. **CLI tool** calls these methods via `gdbus call` commands
3. **Configuration** stored in INI format at `.window_positions.conf`

### Window Matching Strategy
Windows are identified using two methods:
- **WM_CLASS matching** - Primary identifier (e.g., "org.keepassxc.KeePassXC")
- **Title pattern matching** - Secondary filter for multiple windows of same class

### Configuration Format
Uses INI-style sections:
```ini
[section_name]
name = "Friendly Display Name"
x = 100
y = 100
width = 800
height = 600
wm_class = "application.class"
title_pattern = "optional_title_filter"
```

### Key Extension Methods
- `GetActiveWindowInfo()` - Capture current window details (used by `position capture`)
- `PositionWindowByClass(wmClass, x, y, width, height)` - Position by WM_CLASS only
- `PositionWindowByClassAndTitle(wmClass, titlePattern, x, y, width, height)` - Position with title filter

### Development vs Deployment
- **Development**: Edit files in this directory, test with `./position`
- **Deployment**: Run `./setup` to copy to system locations
- **System files**: Treat `/home/ed/bin/position` as read-only deployment artifact

### Important Implementation Details
- Extension uses `window.move_resize_frame()` for positioning
- Qt applications (like KeePassXC) require `window.unmaximize(3)` before positioning
- Config parsing uses `sed` and `awk` for INI section extraction
- Section removal in `clear_config()` preserves spacing between remaining sections
