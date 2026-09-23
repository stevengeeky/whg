// World's Hardest Game Remake - levels
// By Steven Geeky
//
// The play area is 18 x 12 tiles: columns -9 to 8, rows -6 to 5.
// fill(x0, y0, x1, y1, type) lays tiles ("t" floor, "sp" start pad, "cm" goal), spawn(x, y) places the player,
// tc(n) is the middle of tile n, enemy(x, y, radius, [waypoints...], speed) patrols, orbiter(x, y, r, angle, speed) circles.
// Press X in the editor to print a level in this format.

level("First steps", function()
{
    spawn(-9, -1);
    
    fill(-9, -2, 8, 1, "t");
    fill(-9, -2, -8, 1, "sp");
    fill(7, -2, 8, 1, "cm");
    
    enemies.push(new enemy(tc(-6), tc(-2), es, [tc(-6), tc(1)], 2));
    enemies.push(new enemy(tc(-4), tc(1), es, [tc(-4), tc(-2)], 2));
    enemies.push(new enemy(tc(-2), tc(-2), es, [tc(-2), tc(1)], 2));
    enemies.push(new enemy(tc(0), tc(1), es, [tc(0), tc(-2)], 2));
    enemies.push(new enemy(tc(2), tc(-2), es, [tc(2), tc(1)], 2));
    enemies.push(new enemy(tc(4), tc(1), es, [tc(4), tc(-2)], 2));
});

level("Traffic", function()
{
    spawn(-9, -1);
    
    fill(-9, -2, 8, 1, "t");
    fill(-9, -2, -8, 1, "sp");
    fill(7, -2, 8, 1, "cm");
    
    enemies.push(new enemy(tc(-6), tc(-2), es, [tc(5), tc(-2)], 2));
    enemies.push(new enemy(tc(5), tc(-1), es, [tc(-6), tc(-1)], 2));
    enemies.push(new enemy(tc(-6), tc(0), es, [tc(5), tc(0)], 2));
    enemies.push(new enemy(tc(5), tc(1), es, [tc(-6), tc(1)], 2));
});

level("Around the bend", function()
{
    spawn(-9, -5);
    
    fill(-9, -6, 8, -4, "t");
    fill(6, -6, 8, 5, "t");
    fill(-9, 3, 8, 5, "t");
    fill(-9, -6, -8, -4, "sp");
    fill(-9, 3, -8, 5, "cm");
    
    // Along the top
    enemies.push(new enemy(tc(-5), tc(-6), es, [tc(-5), tc(-4)], 2));
    enemies.push(new enemy(tc(-3), tc(-4), es, [tc(-3), tc(-6)], 2));
    enemies.push(new enemy(tc(-1), tc(-6), es, [tc(-1), tc(-4)], 2));
    enemies.push(new enemy(tc(1), tc(-4), es, [tc(1), tc(-6)], 2));
    enemies.push(new enemy(tc(3), tc(-6), es, [tc(3), tc(-4)], 2));
    // Down the side
    enemies.push(new enemy(tc(6), tc(-2), es, [tc(8), tc(-2)], 2));
    enemies.push(new enemy(tc(8), tc(0), es, [tc(6), tc(0)], 2));
    enemies.push(new enemy(tc(6), tc(2), es, [tc(8), tc(2)], 2));
    // Back along the bottom, faster
    enemies.push(new enemy(tc(3), tc(5), es, [tc(3), tc(3)], 3));
    enemies.push(new enemy(tc(1), tc(3), es, [tc(1), tc(5)], 3));
    enemies.push(new enemy(tc(-1), tc(5), es, [tc(-1), tc(3)], 3));
    enemies.push(new enemy(tc(-3), tc(3), es, [tc(-3), tc(5)], 3));
    enemies.push(new enemy(tc(-5), tc(5), es, [tc(-5), tc(3)], 3));
});

level("Spinners", function()
{
    spawn(-9, -6);
    
    fill(-9, -6, -8, -6, "sp");
    fill(-9, -5, -9, 0, "t");       // A one-tile corridor down the left edge...
    fill(-8, 0, -8, 0, "t");        // ...that turns into the room through a one-tile-thick wall
    fill(-7, -5, 5, 4, "t");
    fill(6, 0, 7, 0, "t");
    fill(8, 0, 8, 0, "cm");
    
    enemies.push(new orbiter(tc(-4), tc(-2), 64, 0, .04));
    enemies.push(new orbiter(tc(2), tc(-2), 64, Math.PI, -.04));
    enemies.push(new orbiter(tc(-4), tc(2), 64, Math.PI, .04));
    enemies.push(new orbiter(tc(2), tc(2), 64, 0, -.04));
    enemies.push(new orbiter(tc(-1), tc(0), 48, Math.PI / 2, -.05));
});

level("Pillars", function()
{
    spawn(-9, -1);
    
    fill(-8, -5, 7, 4, "t");
    fill(-9, -1, -9, 0, "sp");
    fill(8, -1, 8, 0, "cm");
    
    // Six single-tile pillars, each with a dot running the ring around it
    bset([-4, -2, 0, -2, 4, -2, -4, 2, 0, 2, 4, 2], undefined);
    
    enemies.push(new enemy(tc(-5), tc(-3), es, [tc(-3), tc(-3), tc(-3), tc(-1), tc(-5), tc(-1)], 2));
    enemies.push(new enemy(tc(1), tc(-1), es, [tc(-1), tc(-1), tc(-1), tc(-3), tc(1), tc(-3)], 2));
    enemies.push(new enemy(tc(3), tc(-3), es, [tc(5), tc(-3), tc(5), tc(-1), tc(3), tc(-1)], 2));
    enemies.push(new enemy(tc(-3), tc(3), es, [tc(-5), tc(3), tc(-5), tc(1), tc(-3), tc(1)], 2));
    enemies.push(new enemy(tc(-1), tc(1), es, [tc(1), tc(1), tc(1), tc(3), tc(-1), tc(3)], 2));
    enemies.push(new enemy(tc(5), tc(3), es, [tc(3), tc(3), tc(3), tc(1), tc(5), tc(1)], 2));
    
    // And one sweeping the middle lane
    enemies.push(new enemy(tc(-8), tc(0), es, [tc(7), tc(0)], 3));
});

level("Thin walls", function()
{
    spawn(-9, -5);
    
    fill(-9, -5, 8, -4, "t");
    fill(8, -3, 8, -3, "t");
    fill(-9, -2, 8, -1, "t");
    fill(-9, 0, -9, 0, "t");
    fill(-9, 1, 8, 2, "t");
    fill(8, 3, 8, 3, "t");
    fill(-9, 4, 8, 5, "t");
    fill(-9, -5, -9, -4, "sp");
    fill(-9, 4, -9, 5, "cm");
    
    enemies.push(new enemy(tc(-7), tc(-5), es, [tc(7), tc(-5)], 3));
    enemies.push(new enemy(tc(7), tc(-4), es, [tc(-7), tc(-4)], 3));
    
    enemies.push(new enemy(tc(7), tc(-2), es, [tc(-7), tc(-2)], 3));
    enemies.push(new enemy(tc(-7), tc(-1), es, [tc(7), tc(-1)], 3));
    enemies.push(new enemy(tc(0), tc(-2), es, [tc(0), tc(-1)], 2));
    
    enemies.push(new enemy(tc(-7), tc(1), es, [tc(-1), tc(1)], 3));
    enemies.push(new enemy(tc(0), tc(1), es, [tc(7), tc(1)], 3));
    enemies.push(new enemy(tc(-1), tc(2), es, [tc(-7), tc(2)], 3));
    enemies.push(new enemy(tc(7), tc(2), es, [tc(0), tc(2)], 3));
    
    enemies.push(new enemy(tc(7), tc(4), es, [tc(-7), tc(4)], 4));
    enemies.push(new enemy(tc(-7), tc(5), es, [tc(7), tc(5)], 4));
});

level("Gears", function()
{
    spawn(-9, -1);
    
    fill(-7, -5, 6, 4, "t");
    fill(-9, -1, -8, 0, "sp");
    fill(7, -1, 8, 0, "cm");
    
    enemies.push(new orbiter(tc(-4), tc(-2), 48, 0, .05));
    enemies.push(new orbiter(tc(0), tc(-2), 48, Math.PI, -.05));
    enemies.push(new orbiter(tc(4), tc(-2), 48, 0, .05));
    enemies.push(new orbiter(tc(-4), tc(2), 48, Math.PI, -.05));
    enemies.push(new orbiter(tc(0), tc(2), 48, 0, .05));
    enemies.push(new orbiter(tc(4), tc(2), 48, Math.PI, -.05));
    
    enemies.push(new enemy(tc(-7), tc(0), es, [tc(6), tc(0)], 3));
    enemies.push(new enemy(tc(6), tc(-5), es, [tc(-7), tc(-5)], 3));
    enemies.push(new enemy(tc(-7), tc(4), es, [tc(6), tc(4)], 3));
});

level("The wheel", function()
{
    spawn(-9, -1);
    
    fill(-7, -5, 6, 4, "t");
    fill(-9, -1, -8, 0, "sp");
    fill(7, -1, 8, 0, "cm");
    
    // Eight dots on the rim, four on the hub, turning the other way
    for (var i = 0; i < 8; i++)
        enemies.push(new orbiter(0, 0, 96, i * Math.PI / 4, .03));
    for (i = 0; i < 4; i++)
        enemies.push(new orbiter(0, 0, 40, i * Math.PI / 2, -.06));
    
    // Lanes around it
    enemies.push(new enemy(tc(-6), tc(-5), es, [tc(-6), tc(4)], 3));
    enemies.push(new enemy(tc(5), tc(4), es, [tc(5), tc(-5)], 3));
    enemies.push(new enemy(tc(6), tc(-5), es, [tc(-7), tc(-5)], 3));
    enemies.push(new enemy(tc(-7), tc(4), es, [tc(6), tc(4)], 3));
});
