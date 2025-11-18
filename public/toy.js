// Simplex Noise Waves. Created by Reinder Nijhoff 2020 - @reindernijhoff
//
// https://turtletoy.net/turtle/a4242cdb2b
//
// Forked from "Simplex Noise Mountains ⛰️" by markknol
// https://turtletoy.net/turtle/44ea2702a3

Canvas.setpenopacity(0.75);
const turtle = new Turtle();


const seed = 69; // min=1, max=100, step=1
const wrinkles = 7; // min=0, max=10, step=.1
const frequency = 0.67; //min=.1, max=10, step=.01
const waveSize = 25; // min=0, max=60, step=.1

const gridX = 1000;
const xDisplacement = .4; // min=0, max=1, step=.01
const gridY = 120; // min=10, max=400, step=1
const fieldSize = 160; // min=100, max=200, step=1

const noise  = new SimplexNoise(seed);

const minHeights = [];
for (let x=0; x<gridX; x++) {
    minHeights[x] = 100; 
}

function walk(i) {
    const gx = (i % gridX);
    const gy = (i / gridX) | 0;

    const x = gx*fieldSize/(gridX-1) - fieldSize/2;
    const y = (gridY - gy)/gridY*fieldSize - fieldSize/2;

    let r = waveSize * .2 * wrinkleNoise(x*frequency/fieldSize, y*frequency/fieldSize);
    const h = minHeights[gx] = Math.min(y + r, minHeights[gx]);
    
    if (gy != (((i-1) / gridX)|0) || i < 2) { 
        turtle.up();
    } else {
        turtle.down();
    }
    
    turtle.goto(x + (h-y) * xDisplacement, h);

    return i < gridX * gridY - 1;
}

function wrinkleNoise(x, y) {
    let n = noise.noise2D([x, y]);
    return Math.sin(n * 3. * wrinkles) * ((.5 + .5 *n)**2);
}

////////////////////////////////////////////////////////////////
// Simplex Noise utility code. Created by Reinder Nijhoff 2020
// https://turtletoy.net/turtle/6e4e06d42e
// Based on: http://webstaff.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
////////////////////////////////////////////////////////////////
function SimplexNoise(seed = 1) {
	const grad = [  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
	            	[1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
            		[0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1] ];
	const perm = new Uint8Array(512);
            		
	const F2 = (Math.sqrt(3) - 1) / 2, F3 = 1/3;
	const G2 = (3 - Math.sqrt(3)) / 6, G3 = 1/6;

	const dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];
	const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
	const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
	const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

	class SimplexNoise {
		constructor(seed = 1) {
			for (let i = 0; i < 512; i++) {
				perm[i] = i & 255;
			}
			for (let i = 0; i < 255; i++) {
				const r = (seed = this.hash(i+seed)) % (256 - i)  + i;
				const swp = perm[i];
				perm[i + 256] = perm[i] = perm[r];
				perm[r + 256] = perm[r] = swp;
			}
		}
		noise2D(p) {
			const s = dot2(p, [F2, F2]);
			const c = [Math.floor(p[0] + s), Math.floor(p[1] + s)];
			const i = c[0] & 255, j = c[1] & 255;
			const t = dot2(c, [G2, G2]);

			const p0 = sub2(p, sub2(c, [t, t]));
			const o  = p0[0] > p0[1] ? [1, 0] : [0, 1];
			const p1 = sub2(sub2(p0, o), [-G2, -G2]);
			const p2 = sub2(p0, [1-2*G2, 1-2*G2]);
			
			let n =  Math.max(0, 0.5-dot2(p0, p0))**4 * dot2(grad[perm[i+perm[j]] % 12], p0);
			    n += Math.max(0, 0.5-dot2(p1, p1))**4 * dot2(grad[perm[i+o[0]+perm[j+o[1]]] % 12], p1);
		    	n += Math.max(0, 0.5-dot2(p2, p2))**4 * dot2(grad[perm[i+1+perm[j+1]] % 12], p2);
			
			return 70 * n;
		}
		hash(i) {
            i = 1103515245 * ((i >> 1) ^ i);
            const h32 = 1103515245 * (i ^ (i>>3));
            return h32 ^ (h32 >> 16);
		}
	}
	return new SimplexNoise(seed);
}