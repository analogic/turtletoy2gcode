/**
 * GCODE Generator for Turtletoy
 * Converts drawing commands to GCODE for 2D plotters
 */

export class GCodeGenerator {
    constructor(config = {}) {
        this.lines = [];
        this.drawCommands = []; // Store drawing commands for regeneration
        this.currentX = 0;
        this.currentY = 0;
        this.penDown = false;
        
        // Configurable GCODE commands
        this.config = {
            penUp: config.penUp || 'M5',
            penDown: config.penDown || 'M3',
            feedRate: config.feedRate || 3000,
            start: config.start || 'G28',
            end: config.end || 'M2',
            // Output scale: 100% = 200 mm tall for full turtle space height
            scalePercent: typeof config.scalePercent === 'number' ? config.scalePercent : 100
        };
        
        this.initialize();
    }
    
    /**
     * Initialize GCODE with startup commands
     */
    initialize() {
        this.lines = [];
        this.currentX = 0;
        this.currentY = 0;
        this.penDown = false;
        
        // Initialization commands
        this.lines.push('G21 ; Set units to millimeters');
        this.lines.push('G90 ; Absolute positioning');
        this.lines.push(`${this.config.start} ;`);
        this.lines.push('');
    }
    
    /**
     * Update GCODE command configuration
     * @param {Object} config - New configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    
    /**
     * Regenerate entire GCODE with saved drawing commands
     */
    regenerate() {
        this._rebuildFromCommands();
    }
    
    /**
     * Add a line to GCODE
     * @param {number} x1 - Starting X coordinate (turtle space -100 to 100)
     * @param {number} y1 - Starting Y coordinate (turtle space -100 to 100)
     * @param {number} x2 - Ending X coordinate
     * @param {number} y2 - Ending Y coordinate
     */
    addLine(x1, y1, x2, y2) {
        // Save command for regeneration
        this.drawCommands.push({ x1, y1, x2, y2 });
    }
    
    /**
     * Internal: convert and push a single line with current config
     */
    _emitLine(x1, y1, x2, y2, scale, xShift, yShift) {
        // Invert Y for plotter (Y-up)
        const iy1 = -y1;
        const iy2 = -y2;
        // Convert to mm: shift both X and Y so leftmost point maps to X=0 and lowest point maps to Y=0
        const gx1 = (x1 - xShift) * scale;
        const gy1 = (iy1 - yShift) * scale;
        const gx2 = (x2 - xShift) * scale;
        const gy2 = (iy2 - yShift) * scale;

        // Rapid move to start
        if (Math.abs(gx1 - this.currentX) > 0.01 || Math.abs(gy1 - this.currentY) > 0.01) {
            if (this.penDown) {
                this.lines.push(`${this.config.penUp} ; Pen up`);
                this.penDown = false;
            }
            this.lines.push(`G0 X${gx1.toFixed(3)} Y${gy1.toFixed(3)} ;`);
            this.currentX = gx1;
            this.currentY = gy1;
        }

        // Linear move with pen down
        if (!this.penDown) {
            this.lines.push(`${this.config.penDown} ; Pen down`);
            this.penDown = true;
        }
        this.lines.push(`G1 X${gx2.toFixed(3)} Y${gy2.toFixed(3)} F${this.config.feedRate} ;`);
        this.currentX = gx2;
        this.currentY = gy2;
    }

    /**
     * Internal: rebuild GCODE lines from recorded commands using current config
     */
    _rebuildFromCommands() {
        // Reset and write header
        this.lines = [];
        this.currentX = 0;
        this.currentY = 0;
        this.penDown = false;
        this.lines.push('G21 ; Set units to millimeters');
        this.lines.push('G90 ; Absolute positioning');
        this.lines.push(`${this.config.start} ;`);
        this.lines.push('');

        if (this.drawCommands.length === 0) {
            this.lines.push('; No drawing commands recorded');
            this.lines.push('');
            this.lines.push('G0 X0 Y0 ; Return to origin');
            this.lines.push(`${this.config.end} ; End program`);
            return;
        }

        // Compute scale and bounding box: find min X and min Y (after inversion)
        const scale = (typeof this.config.scalePercent === 'number' ? this.config.scalePercent : 100) / 100;
        let minX = Infinity;
        let minYInv = Infinity;
        for (const { x1, y1, x2, y2 } of this.drawCommands) {
            if (x1 < minX) minX = x1;
            if (x2 < minX) minX = x2;
            const iy1 = -y1;
            const iy2 = -y2;
            if (iy1 < minYInv) minYInv = iy1;
            if (iy2 < minYInv) minYInv = iy2;
        }
        const xShift = minX; // subtract this from X so leftmost point -> 0
        const yShift = minYInv; // subtract this from inverted Y so lowest point -> 0

        // Emit all moves
        for (const { x1, y1, x2, y2 } of this.drawCommands) {
            this._emitLine(x1, y1, x2, y2, scale, xShift, yShift);
        }

        // End section
        if (this.penDown) {
            this.lines.push(`${this.config.penUp} ; Pen up`);
            this.penDown = false;
        }
        this.lines.push('');
        this.lines.push('G0 X0 Y0 ; Return to origin');
        this.lines.push(`${this.config.end} ; End program`);
    }
    
    /**
     * Finalize GCODE and add ending commands
     */
    finalize() {
        this._rebuildFromCommands();
    }
    
    /**
     * Return entire GCODE as string
     * @returns {string}
     */
    getGCode() {
        return this.lines.join('\n');
    }
    
    /**
     * Clear all GCODE commands
     */
    clear() {
        this.lines = [];
        this.drawCommands = [];
        this.currentX = 0;
        this.currentY = 0;
        this.penDown = false;
    }
}
