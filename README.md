# Turtletoy GCODE Generator

A web-based tool for generating GCODE from Turtletoy drawings, perfect for pen plotters and CNC machines.

## Features

- **Live Code Editor**: Edit JavaScript code in Monaco Editor with syntax highlighting
- **Canvas Preview**: Real-time visualization of your turtle graphics
- **GCODE Generation**: Automatic conversion to plotter-ready GCODE
  - Configurable pen up/down commands
  - Adjustable feed rate
  - Scalable output (% based)
  - Custom start/end sequences
  - Automatic Y-axis inversion for plotter coordinates
  - Automatic alignment to (0,0) origin
- **Persistence**: Code and settings saved to localStorage
- **Download**: Export GCODE files directly

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Stack

- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (locally bundled)
- **Turtletoy** - Turtle graphics library
- **Bootstrap 5** - UI framework

## Usage

1. Write or edit turtle graphics code in the right panel
2. Click "Redraw" to render on canvas
3. Configure GCODE settings (pen commands, feed rate, scale)
4. Click "Regenerate GCODE" to update with new settings
5. Click "Download GCODE" to save the file

## GCODE Configuration

- **Pen Up/Down**: Custom commands for your plotter (e.g., M5/M3 or G0 Z5/G0 Z0)
- **Feed Rate**: Movement speed in mm/min
- **Scale**: Output size as percentage (100% ≈ 200mm)
- **Start/End**: Custom initialization and cleanup commands

## Deployment

### Netlify
```bash
npm run build
# Then drag the dist/ folder to netlify.com
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

### GitHub Pages
Push to GitHub and enable Pages in repository settings with the workflow provided in `.github/workflows/deploy.yml`.

## License

ISC
