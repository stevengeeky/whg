# whg
A conceptual implementation of the *World's Hardest Game* with an in-game editor (click to add/remove a tile). Not complete.

Open `index.html` in a browser. No build step, no server.

## Playing
- **Arrow keys** move the red square. Get from the green start pad to the green goal pad without touching a blue dot.
- Eight levels play in order; beating the last one shows a win screen. Deaths are counted across all levels.
- **1–9** jump to a level you have already reached, **0** opens the sandbox, **R** restarts the level. The boxes in the bar at the top do the same with the mouse.
- Your best level and death count are saved in the browser (`localStorage`) and picked up next time.

## Editing
- **E** toggles the editor. While it is on, click (or drag) to add floor tiles and click a tile to remove it. Walls redraw themselves around whatever floor is there.
- **X** prints the current level to the browser console as JS in the format of `scripts/levels.js` (and copies it to the clipboard when the browser allows). Paste it into `scripts/levels.js` inside a `level("Name", function() { ... });` block to add it to the game.

## Level API (`scripts/levels.js`)
The play area is 18 x 12 tiles, columns -9 to 8 and rows -6 to 5.
- `fill(x0, y0, x1, y1, type)` lays a rectangle of tiles: `"t"` floor, `"sp"` start pad, `"cm"` goal.
- `spawn(x, y)` puts the player in tile (x, y) and makes it the respawn point.
- `enemies.push(new enemy(x, y, es, [x1, y1, x2, y2, ...], speed))` is a dot that patrols the waypoints and back; `tc(n)` is the middle of tile n.
- `enemies.push(new orbiter(x, y, r, angle, speed))` is a dot circling a point.

## Known Issues
The single-tile-wide corridor drawing issue is fixed: walls are now derived from the floor around them, so a wall with floor on any combination of sides draws every edge.
