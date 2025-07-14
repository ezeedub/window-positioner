// Window Positioner Extension - GNOME Shell 46 Compatible
// Rewritten from scratch with ES6 modules
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const DBUS_INTERFACE_XML = `
<node>
    <interface name="org.gnome.Shell.WindowPositioner">
        <method name="PositionWindow">
            <arg type="s" direction="in" name="windowTitle"/>
            <arg type="i" direction="in" name="x"/>
            <arg type="i" direction="in" name="y"/>
            <arg type="i" direction="in" name="width"/>
            <arg type="i" direction="in" name="height"/>
            <arg type="b" direction="out" name="success"/>
        </method>
        <method name="PositionWindowByClass">
            <arg type="s" direction="in" name="wmClass"/>
            <arg type="i" direction="in" name="x"/>
            <arg type="i" direction="in" name="y"/>
            <arg type="i" direction="in" name="width"/>
            <arg type="i" direction="in" name="height"/>
            <arg type="b" direction="out" name="success"/>
        </method>
        <method name="PositionWindowByClassAndTitle">
            <arg type="s" direction="in" name="wmClass"/>
            <arg type="s" direction="in" name="titlePattern"/>
            <arg type="i" direction="in" name="x"/>
            <arg type="i" direction="in" name="y"/>
            <arg type="i" direction="in" name="width"/>
            <arg type="i" direction="in" name="height"/>
            <arg type="b" direction="out" name="success"/>
        </method>
        <method name="GetActiveWindowInfo">
            <arg type="s" direction="out" name="windowData"/>
        </method>
        <method name="GetMonitorInfo">
            <arg type="s" direction="out" name="monitorData"/>
        </method>
        <method name="GetWindowInfo">
            <arg type="s" direction="in" name="windowTitle"/>
            <arg type="s" direction="out" name="windowData"/>
        </method>
    </interface>
</node>`;

export default class WindowPositionerExtension {
    constructor() {
        this._dbus = null;
    }

    enable() {
        try {
            console.log('[WindowPositioner] Enabling extension...');
            
            // Create D-Bus exported object
            this._dbus = Gio.DBusExportedObject.wrapJSObject(DBUS_INTERFACE_XML, this);
            this._dbus.export(Gio.DBus.session, '/org/gnome/Shell/WindowPositioner');
            
            console.log('[WindowPositioner] Extension enabled successfully - D-Bus interface exported');
        } catch (error) {
            console.error('[WindowPositioner] Failed to enable extension:', error);
            throw error;
        }
    }

    disable() {
        try {
            console.log('[WindowPositioner] Disabling extension...');
            
            if (this._dbus) {
                this._dbus.unexport();
                this._dbus = null;
            }
            
            console.log('[WindowPositioner] Extension disabled successfully');
        } catch (error) {
            console.error('[WindowPositioner] Failed to disable extension:', error);
        }
    }

    // Find window by title (partial case-insensitive match)
    PositionWindow(windowTitle, x, y, width, height) {
        try {
            console.log(`[WindowPositioner] PositionWindow: "${windowTitle}" to ${x},${y} ${width}x${height}`);
            
            const windows = global.get_window_actors();
            let targetWindow = null;

            for (const windowActor of windows) {
                const window = windowActor.get_meta_window();
                const title = window.get_title();
                
                if (title && title.toLowerCase().includes(windowTitle.toLowerCase())) {
                    targetWindow = window;
                    break;
                }
            }

            if (!targetWindow) {
                console.log(`[WindowPositioner] Window with title containing "${windowTitle}" not found`);
                return false;
            }

            return this._moveWindow(targetWindow, x, y, width, height);
        } catch (error) {
            console.error('[WindowPositioner] Error in PositionWindow:', error);
            return false;
        }
    }

    // Find window by WM_CLASS
    PositionWindowByClass(wmClass, x, y, width, height) {
        try {
            console.log(`[WindowPositioner] PositionWindowByClass: "${wmClass}" to ${x},${y} ${width}x${height}`);
            
            const windows = global.get_window_actors();
            let targetWindow = null;

            for (const windowActor of windows) {
                const window = windowActor.get_meta_window();
                const windowClass = window.get_wm_class();
                
                if (windowClass && windowClass.toLowerCase() === wmClass.toLowerCase()) {
                    targetWindow = window;
                    break;
                }
            }

            if (!targetWindow) {
                console.log(`[WindowPositioner] Window with WM_CLASS "${wmClass}" not found`);
                this._debugAvailableWindows();
                return false;
            }

            return this._moveWindow(targetWindow, x, y, width, height);
        } catch (error) {
            console.error('[WindowPositioner] Error in PositionWindowByClass:', error);
            return false;
        }
    }

    // Find window by WM_CLASS and title pattern
    PositionWindowByClassAndTitle(wmClass, titlePattern, x, y, width, height) {
        try {
            console.log(`[WindowPositioner] PositionWindowByClassAndTitle: "${wmClass}" + "${titlePattern}" to ${x},${y} ${width}x${height}`);
            
            const windows = global.get_window_actors();
            let targetWindow = null;

            for (const windowActor of windows) {
                const window = windowActor.get_meta_window();
                const windowClass = window.get_wm_class();
                const windowTitle = window.get_title();
                
                if (windowClass && windowClass.toLowerCase() === wmClass.toLowerCase() &&
                    windowTitle && windowTitle.toLowerCase().includes(titlePattern.toLowerCase())) {
                    targetWindow = window;
                    break;
                }
            }

            if (!targetWindow) {
                console.log(`[WindowPositioner] Window with WM_CLASS "${wmClass}" and title containing "${titlePattern}" not found`);
                this._debugAvailableWindows();
                return false;
            }

            return this._moveWindow(targetWindow, x, y, width, height);
        } catch (error) {
            console.error('[WindowPositioner] Error in PositionWindowByClassAndTitle:', error);
            return false;
        }
    }

    // Get information about the currently active window
    GetActiveWindowInfo() {
        try {
            console.log('[WindowPositioner] GetActiveWindowInfo called');
            
            // Try multiple methods to get the focused window
            let window = global.display.get_focus_window();
            
            if (!window) {
                // Fallback: get the topmost normal window
                const windows = global.get_window_actors();
                for (const windowActor of windows) {
                    const testWindow = windowActor.get_meta_window();
                    if (testWindow.get_window_type() === 0) { // META_WINDOW_NORMAL
                        window = testWindow;
                        break;
                    }
                }
            }
            
            if (!window) {
                const errorData = { error: "No active window found" };
                console.log('[WindowPositioner] No active window found');
                return JSON.stringify(errorData);
            }

            const rect = window.get_frame_rect();
            const windowData = {
                title: window.get_title() || "Unknown",
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                maximized: window.get_maximized(),
                minimized: window.is_hidden(),
                wmClass: window.get_wm_class() || "Unknown"
            };

            console.log('[WindowPositioner] Returning window data:', JSON.stringify(windowData));
            return JSON.stringify(windowData);
        } catch (error) {
            console.error('[WindowPositioner] Error in GetActiveWindowInfo:', error);
            return JSON.stringify({ error: error.toString() });
        }
    }

    // Get monitor layout information
    GetMonitorInfo() {
        try {
            console.log('[WindowPositioner] GetMonitorInfo called');
            
            const monitors = Main.layoutManager.monitors;
            const monitorData = [];

            monitors.forEach((monitor, index) => {
                monitorData.push({
                    index: index,
                    x: monitor.x,
                    y: monitor.y,
                    width: monitor.width,
                    height: monitor.height,
                    isPrimary: index === Main.layoutManager.primaryIndex
                });
            });

            const result = JSON.stringify(monitorData);
            console.log('[WindowPositioner] Returning monitor data:', result);
            return result;
        } catch (error) {
            console.error('[WindowPositioner] Error in GetMonitorInfo:', error);
            return JSON.stringify([]);
        }
    }

    // Get information about a specific window by title
    GetWindowInfo(windowTitle) {
        try {
            console.log(`[WindowPositioner] GetWindowInfo: "${windowTitle}"`);
            
            const windows = global.get_window_actors();
            let targetWindow = null;

            for (const windowActor of windows) {
                const window = windowActor.get_meta_window();
                const title = window.get_title();
                
                if (title && title.toLowerCase().includes(windowTitle.toLowerCase())) {
                    targetWindow = window;
                    break;
                }
            }

            if (!targetWindow) {
                const errorData = { error: `Window with title containing "${windowTitle}" not found` };
                return JSON.stringify(errorData);
            }

            const rect = targetWindow.get_frame_rect();
            const windowData = {
                title: targetWindow.get_title() || "Unknown",
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                maximized: targetWindow.get_maximized(),
                minimized: targetWindow.is_hidden(),
                wmClass: targetWindow.get_wm_class() || "Unknown"
            };

            return JSON.stringify(windowData);
        } catch (error) {
            console.error('[WindowPositioner] Error in GetWindowInfo:', error);
            return JSON.stringify({ error: error.toString() });
        }
    }

    // Private helper method to move/resize a window
    _moveWindow(window, x, y, width, height) {
        try {
            // Unmaximize the window first (both horizontally and vertically)
            window.unmaximize(3);
            
            // Move and resize the window
            window.move_resize_frame(false, x, y, width, height);
            
            const title = window.get_title();
            const wmClass = window.get_wm_class();
            console.log(`[WindowPositioner] Successfully positioned "${title}" (${wmClass}) to ${x},${y} ${width}x${height}`);
            
            return true;
        } catch (error) {
            console.error('[WindowPositioner] Error moving window:', error);
            return false;
        }
    }

    // Debug helper to list available windows
    _debugAvailableWindows() {
        try {
            console.log('[WindowPositioner] Available windows:');
            const windows = global.get_window_actors();
            
            windows.forEach((windowActor, index) => {
                const window = windowActor.get_meta_window();
                if (window.get_window_type() === 0) { // Normal windows only
                    const title = window.get_title() || "No title";
                    const wmClass = window.get_wm_class() || "No class";
                    console.log(`[WindowPositioner]   ${index}: "${wmClass}" - "${title}"`);
                }
            });
        } catch (error) {
            console.error('[WindowPositioner] Error listing windows:', error);
        }
    }
}