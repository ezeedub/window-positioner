# Window Positioning System

A GNOME Shell extension and command-line tool for capturing and positioning windows at precise locations on your desktop.

## Features

- **Capture window positions** - Save current window location and size
- **Position windows** - Move windows to saved positions instantly
- **Flexible matching** - Match by WM_CLASS or title patterns
- **Configuration management** - Edit, list, and clear saved configurations
- **Debug tools** - View window information for troubleshooting

## Installation

1. **Install dependencies**:
   ```bash
   sudo apt install jq
   ```

2. **Run setup**:
   ```bash
   ./setup
   ```

3. **Log out and back in** (required for extension changes to take effect)

The setup script will:
- Install the GNOME Shell extension
- Copy the `position` script to `~/bin/`
- Add `~/bin` to your PATH (if needed)
- Auto-enable the extension after login

## Usage

### Basic Commands

```bash
# Capture current window position
position capture

# Position a saved window
position <config_name>

# List all saved configurations
position list

# Show detailed configuration info
position list --full
position list <config_name>

# Edit a configuration
position edit <config_name>

# Remove a configuration
position clear <config_name>

# Remove all configurations
position clear-all

# Debug: show all windows with WM_CLASS values
position debug
```

### Examples

```bash
# Capture KeePassXC window position
position capture
# Follow prompts to name it "keepass"

# Position KeePassXC window
position keepass

# List all saved configurations
position list

# Show detailed info for specific config
position list keepass

# Edit the keepass configuration
position edit keepass
```

## Configuration

Window configurations are stored in `.window_positions.conf` in INI format:

```ini
[keepass]
name = "KeePassXC"
x = 100
y = 100
width = 800
height = 600
wm_class = "org.keepassxc.KeePassXC"
title_pattern = "KeePassXC"
```

## Window Matching

The system uses two matching strategies:

1. **WM_CLASS matching** - Primary identifier (e.g., "org.keepassxc.KeePassXC")
2. **Title pattern matching** - Optional filter for multiple windows of the same class

When capturing a window, you can:
- Use WM_CLASS only (matches any window of that application)
- Add a title pattern (matches specific windows with that title)

## Development

### Project Structure

- `extension.js` - GNOME Shell extension (D-Bus interface)
- `position` - Command-line tool
- `setup` - Deployment script
- `metadata.json` - Extension metadata

### Development Workflow

1. **Edit files** in this directory
2. **Test locally**: `./position <command>`
3. **Deploy changes**: `./setup`
4. **Log out/in** for extension updates

### Key Commands

```bash
# Test CLI tool locally
./position capture

# Deploy to system locations
./setup

# Enable extension
gnome-extensions enable window-positioner@example.com

# Monitor extension logs
journalctl --user -f --grep="WindowPositioner"
```

## Architecture

The system uses a hybrid approach:

1. **Extension** exports D-Bus methods at `/org/gnome/Shell/WindowPositioner`
2. **CLI tool** calls these methods via `gdbus call` commands
3. **Configuration** stored in INI format

### Key Extension Methods

- `GetActiveWindowInfo()` - Capture current window details
- `PositionWindowByClass(wmClass, x, y, width, height)` - Position by WM_CLASS
- `PositionWindowByClassAndTitle(wmClass, titlePattern, x, y, width, height)` - Position with title filter

## Troubleshooting

### Extension Not Working

1. Check if extension is enabled:
   ```bash
   gnome-extensions list --enabled | grep window-positioner
   ```

2. Check extension logs:
   ```bash
   journalctl --user -f --grep="WindowPositioner"
   ```

3. Re-enable extension:
   ```bash
   gnome-extensions disable window-positioner@example.com
   gnome-extensions enable window-positioner@example.com
   ```

### Window Not Positioning

1. Check if application is running
2. Verify WM_CLASS with: `position debug`
3. Try without title pattern (edit config to remove it)
4. Check extension logs for errors

### Missing Dependencies

```bash
# Install jq
sudo apt install jq

# Check if ~/bin is in PATH
echo $PATH | grep -q "$HOME/bin" || echo "Add ~/bin to PATH"
```

## License

This project is open source. See the code for implementation details.

## Project Status

This is a personal tool built for my specific needs. It is not actively maintained for public use. Feel free to fork it, but please note that I may not respond to issues or pull requests.