import { turtleDraw, Canvas, Turtle } from 'turtletoy';
import { GCodeGenerator } from './gcode-generator.js';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
// Include Monaco CSS
import 'monaco-editor/min/vs/editor/editor.main.css';
// Register JavaScript language and TS/JS worker contributions
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';

// Wait for Monaco Editor to be ready
window.addEventListener('load', async () => {
    // Import toy.js and run it
    const response = await fetch('./toy.js');
    const originalCode = await response.text();
    
    // Load code from localStorage or use original
    let currentCode = localStorage.getItem('edited-code') || originalCode;
    
    // Create Monaco Editor (locally via npm package)
    const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: currentCode,
        language: 'javascript',
        theme: 'vs',
        automaticLayout: true,
        fontSize: 14,
        minimap: {
            enabled: true
        },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 4
    });
    
    // Save changes to localStorage on edit
    let saveTimeout;
    editor.onDidChangeModelContent(() => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            localStorage.setItem('edited-code', editor.getValue());
            console.log('Code saved to localStorage');
        }, 1000); // Save after 1 second of inactivity
    });
    
    console.log('Monaco Editor initialized');
    
    // Load saved GCODE commands from localStorage
    const savedConfig = {
        penUp: localStorage.getItem('gcode-penup') || 'G0 Z5',
        penDown: localStorage.getItem('gcode-pendown') || 'G0 Z0',
        feedRate: parseInt(localStorage.getItem('gcode-feedrate')) || 3000,
        start: localStorage.getItem('gcode-start') || 'G28',
        end: localStorage.getItem('gcode-end') || 'M2',
        scalePercent: parseFloat(localStorage.getItem('gcode-scale')) || 100
    };
    
    // Set values to inputs
    document.getElementById('gcode-penup').value = savedConfig.penUp;
    document.getElementById('gcode-pendown').value = savedConfig.penDown;
    document.getElementById('gcode-feedrate').value = savedConfig.feedRate;
    document.getElementById('gcode-start').value = savedConfig.start;
    document.getElementById('gcode-end').value = savedConfig.end;
    document.getElementById('gcode-scale').value = savedConfig.scalePercent;
    
    // Save values on change
    function saveConfigToLocalStorage() {
        localStorage.setItem('gcode-penup', document.getElementById('gcode-penup').value);
        localStorage.setItem('gcode-pendown', document.getElementById('gcode-pendown').value);
        localStorage.setItem('gcode-feedrate', document.getElementById('gcode-feedrate').value);
        localStorage.setItem('gcode-start', document.getElementById('gcode-start').value);
        localStorage.setItem('gcode-end', document.getElementById('gcode-end').value);
        localStorage.setItem('gcode-scale', document.getElementById('gcode-scale').value);
    }
    
    // Add event listeners for automatic saving
    document.getElementById('gcode-penup').addEventListener('change', saveConfigToLocalStorage);
    document.getElementById('gcode-pendown').addEventListener('change', saveConfigToLocalStorage);
    document.getElementById('gcode-feedrate').addEventListener('change', saveConfigToLocalStorage);
    document.getElementById('gcode-start').addEventListener('change', saveConfigToLocalStorage);
    document.getElementById('gcode-end').addEventListener('change', saveConfigToLocalStorage);
    document.getElementById('gcode-scale').addEventListener('change', saveConfigToLocalStorage);
    
    console.log('Loaded toy.js');
    
    // Initialize turtletoy on canvas element
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const gcodeOutput = document.getElementById('gcode-output');
    
    // Canvas context setup
    const size = 1024;
    const scale = size / 200;
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    
    // Function to convert world coordinates to canvas coordinates
    function worldToCanvas(x, y) {
        const canvasX = (x + 100) * scale;
        const canvasY = (y + 100) * scale;
        return [canvasX, canvasY];
    }
    
    // Initialize GCODE generator with loaded configuration
    const gcodeGen = new GCodeGenerator(savedConfig);
    
    // Function to draw code
    let currentDrawingResult = null;
    let finalizeTimer = null;
    
    function drawCode(code) {
        // Stop previous rendering if running
        if (currentDrawingResult) {
            currentDrawingResult.stop();
        }
        
        // Clear canvas
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        
        // Clear GCODE generator
        gcodeGen.clear();
        gcodeGen.initialize();
        
        // Clear output
        gcodeOutput.value = gcodeGen.getGCode();
        
        try {
            // Run code with callback to capture lines
            currentDrawingResult = turtleDraw(code, {
                htmlcanvas: canvas,
                raf: true,
                onDrawLine: (x1, y1, x2, y2) => {
                    // Draw on canvas
                    const [cx1, cy1] = worldToCanvas(x1, y1);
                    const [cx2, cy2] = worldToCanvas(x2, y2);
                    
                    ctx.beginPath();
                    ctx.moveTo(cx1, cy1);
                    ctx.lineTo(cx2, cy2);
                    ctx.stroke();
                    
                    // Add to GCODE (just storing commands for now)
                    gcodeGen.addLine(x1, y1, x2, y2);

                    // Debounce finalize: when drawing pauses, regenerate full GCODE
                    if (finalizeTimer) clearTimeout(finalizeTimer);
                    finalizeTimer = setTimeout(() => {
                        gcodeGen.finalize();
                        gcodeOutput.value = gcodeGen.getGCode();
                        gcodeOutput.scrollTop = gcodeOutput.scrollHeight;
                    }, 400);
                },
                onStepError: (err, step) => {
                    console.error('Error at step', step, ':', err);
                }
            });
            
            console.log('turtleDraw started');
        } catch (err) {
            console.error('Error during rendering:', err);
            alert('Error during rendering: ' + err.message);
        }
    }
    
    // Redraw button
    document.getElementById('redraw-button').addEventListener('click', () => {
        const code = editor.getValue();
        localStorage.setItem('edited-code', code);
        console.log('Redrawing with current code...');
        drawCode(code);
    });
    
    // Regenerate GCODE button
    document.getElementById('regenerate-gcode').addEventListener('click', () => {
        saveConfigToLocalStorage();
        
        // Update generator configuration
        gcodeGen.updateConfig({
            penUp: document.getElementById('gcode-penup').value,
            penDown: document.getElementById('gcode-pendown').value,
            feedRate: parseInt(document.getElementById('gcode-feedrate').value),
            start: document.getElementById('gcode-start').value,
            end: document.getElementById('gcode-end').value,
            scalePercent: parseFloat(document.getElementById('gcode-scale').value)
        });
        
        // Regenerate GCODE
        gcodeGen.regenerate();
        gcodeOutput.value = gcodeGen.getGCode();
        console.log('GCODE regenerated with new configuration');
    });
    
    // Download GCODE button
    document.getElementById('download-gcode').addEventListener('click', () => {
        const gcodeContent = gcodeOutput.value;
        
        if (!gcodeContent || gcodeContent.trim() === '') {
            alert('GCODE is empty. Wait for rendering to complete.');
            return;
        }
        
        // Create blob with GCODE content
        const blob = new Blob([gcodeContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create temporary link for download
        const a = document.createElement('a');
        a.href = url;
        a.download = `turtletoy-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.gcode`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('GCODE downloaded');
    });
    
    // Run initial rendering
    drawCode(currentCode);
});
