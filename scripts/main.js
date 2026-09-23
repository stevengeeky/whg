// World's Hardest Game Remake

// Modifiable Declarations
var _levels = [], clevel = 0, playerOpacity = 1, screenFadeOpacity = 0;
var requestNextLevel = false, requestedLevel = null, won = false;
var afterPause;

var deaths = 0, best = 0;           // Persisted in localStorage (see saveProgress)
var editing = false, painting = false;
var notice = "", noticeTimer = 0;   // A line of text shown over the play area for a moment
var hh = 44;                        // Height of the bar above the play area (level, level select, deaths)

// ////////////////////////////
var mc, ctx;

var player, enemies = [], levelCompleted = false;
var blocks = [], bs = 32, bl = 256;

var ps = 24, es = 12, wlw = 1.5;

var mouse = {
    x:0,
    y:0,
    isdown:false,
    which:1,
    fdown:false,
    fup:false
}

var camera = { x:0, y:0, scale:1 };
var isdead = false;
var resx = 0, resy = 0, timer = 0;

var downfloor = false;

var buffered = [];

function sandbox()
{
    makePlayer(-ps / 2, -ps / 2);
    
    enemies.push(new enemy(cepx(64), cepy(0), es, [cepx(128), cepy(-64)], 2));
    
    bset([-1, -4, -1, -3, -1, -2, -1, -1, -1, 0,
          0, -4, 0, -3, 0, -2, 0, -1, 0, 0,
          1, -4, 1, -3, 1, -2, 1, -1, 1, 0,
          2, -4, 2, -3, 2, -2, 2, -1, 2, 0,
          3, -4, 3, -3, 3, -2, 3, -1, 3, 0,
          4, -4, 4, -3, 4, -2, 4, -1, 4, 0], new block("t"));
    bset([5, -4, 5, -3, 6, -4, 6, -3], new block("cm"));
}

function makePlayer(x, y)
{
    player = new rectangle(x, y, ps, ps);
    resx = player.x;
    resy = player.y;
}

function cepx(x)    // Returns a centered x at the block selected by the given x (will automatically be modulated)
{
    return x - mod(x - es, bs) + (bs - es * 2) / 2;
}
function cepy(y)    // Returns a centered y at the block selected by the given y (will automatically be modulated)
{
    return y - mod(y - es, bs) + (bs - es * 2) / 2;
}

// Level API (used by scripts/levels.js and by the exporter)
function tc(n)      // Returns the centered world coordinate of tile n (also works for negative tiles)
{
    return n * bs + bs / 2;
}
function spawn(x, y)    // Puts the player in the middle of tile (x, y) and makes it the respawn point
{
    makePlayer(x * bs + (bs - ps) / 2, y * bs + (bs - ps) / 2);
}
function fill(x0, y0, x1, y1, type)     // Fills the tiles from (x0, y0) to (x1, y1) inclusive ("t" floor, "sp" start pad, "cm" goal)
{
    for (var x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
        for (var y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
            bset(x, y, new block(type || "t"));
}
function level(title, f)    // Registers a level; scripts/levels.js is a list of these, played in order
{
    f.title = title;
    _levels.push(f);
}
function flash(text)    // Shows a line of text over the play area for a few seconds
{
    notice = text;
    noticeTimer = 200;
}

// ///////////////////////////////

window.onload = function()
{
    mc = document.createElement("canvas");
    ctx = mc.getContext("2d");
    
    document.body.style.background = "black";
    
    mc.width = 640;
    mc.height = 480 + hh;
    mc.style.position = "fixed";
    
    mc.style.background = "lightblue";
    
    function resized()
    {
        mc.style.left = (window.innerWidth - mc.width) / 2 + "px";
        mc.style.top = (window.innerHeight - mc.height) / 2 + "px";
    }
    resized();
    window.onresize = resized;
    
    camera.x = -mc.width / 2;
    camera.y = -(mc.height - hh) / 2 - hh;      // World (0, 0) sits in the middle of the play area below the bar
    
    loadProgress();
    
    if (_levels.length)
        goto(Math.min(best, _levels.length - 1));
    else
        sandbox();
    
    mc.onmousedown = function(e)
    {
        mouse.x = e.pageX - mc.offsetLeft;
        mouse.y = e.pageY - mc.offsetTop;
        mouse.isdown = true;
        mouse.fdown = true;
        mouse.which = e.which;
    };
    mc.onmousemove = function(e)
    {
        mouse.x = e.pageX - mc.offsetLeft;
        mouse.y = e.pageY - mc.offsetTop;
    };
    mc.onmouseup = function(e)
    {
        mouse.x = e.pageX - mc.offsetLeft;
        mouse.y = e.pageY - mc.offsetTop;
        mouse.isdown = false;
        mouse.fup = true;
        mouse.which = e.which;
    };
    
    document.body.appendChild(mc);
    _loop();
};

function completeLevel()
{
    requestNextLevel = true;
    levelCompleted = true;
    
    buffered.push(fadeOutBuffer);
}

function afterFadeOut()
{
    if (requestNextLevel)
        nextLevel();
    else if (requestedLevel !== null)
    {
        goto(requestedLevel);
        requestedLevel = null;
        buffered.push(fadeInBuffer);
    }
}

function afterFadeIn()
{
    levelCompleted = false;
}

function nextLevel()
{
    requestNextLevel = false;
    buffered.push(pauseBuffer);
    
    afterPause = function(){
        buffered.push(fadeInBuffer);
        afterPause = null;
        
        goto(clevel + 1);
    };
}

function goto(n)    // Loads level n; -1 (or anything else that isn't a level) is the sandbox, past the last level is the win screen
{
    var nl = _levels[n];
    
    blocks = [];
    enemies = [];
    isdead = false;
    won = false;
    playerOpacity = 1;
    painting = false;
    
    if (typeof nl == "function")
    {
        clevel = n;
        nl();
        
        if (n > best)
        {
            best = n;
            saveProgress();
        }
    }
    else if (_levels.length && n >= _levels.length)
    {
        clevel = _levels.length;
        won = true;
        
        if (best < _levels.length)
        {
            best = _levels.length;
            saveProgress();
        }
    }
    else
    {
        clevel = -1;
        sandbox();
    }
}

function jump(n)    // Fades out, then loads level n (locked levels are ignored)
{
    if (levelCompleted || isdead)
        return;
    if (n > best && n < _levels.length)
        return;
    
    levelCompleted = true;
    requestedLevel = n;
    buffered.push(fadeOutBuffer);
}

function saveProgress()
{
    try
    {
        localStorage.setItem("whg", JSON.stringify({ best:best, deaths:deaths }));
    }
    catch (e) {}
}
function loadProgress()
{
    try
    {
        var p = JSON.parse(localStorage.getItem("whg"));
        if (p)
        {
            best = p.best || 0;
            deaths = p.deaths || 0;
        }
    }
    catch (e) {}
}

function _loop()
{
    window.requestAnimationFrame(_loop);
    
    timer++;
    handleBuffered();
    
    clear();
    input();
    update();
    
    if (screenFadeOpacity != 0)
    {
        ctx.fillStyle = "rgba(0, 0, 0, " + screenFadeOpacity + ")";
        ctx.fillRect(0, 0, mc.width, mc.height);
    }
    
    bar();
    
    mouse.fdown = false;
    mouse.fup = false;
}

function handleBuffered()
{
    for (var i = 0; i < buffered.length; i++)
    {
        var f = buffered[i];
        
        if (f())
        {
            buffered.splice(i, 1);
            i--;
        }
        
    }
}

function input()
{
    var sp = 2;
    var tm, tmm, b, k, i;
    
    // Keys that act once per press
    for (i = 0; i < pressed.length; i++)
    {
        k = pressed[i];
        
        if (k >= 48 && k <= 57)         // 1-9 pick a level, 0 is the sandbox
            jump(k - 49);
        else if (k == 69)               // E toggles the editor
        {
            editing = !editing;
            flash(editing ? "EDITOR ON  -  click to add a tile, click a tile to remove it, X exports" : "EDITOR OFF");
        }
        else if (k == 88)               // X exports the level as JS
            exportLevel();
        else if (k == 82)               // R restarts the level
            jump(clevel);
        else if (won)                   // Any other key leaves the win screen
            jump(0);
    }
    pressed = [];
    
    if (mouse.fdown && mouse.y < hh)
    {
        var boxes = barBoxes();
        for (i = 0; i < boxes.length; i++)
            if (pwithinr(mouse.x, mouse.y, boxes[i]))
                jump(boxes[i].n);
    }
    
    if (isdead || levelCompleted)
        return;
    
    if (won)
    {
        if (mouse.fdown && mouse.y >= hh)
            jump(0);
        return;
    }
    
    if (editing)
    {
        if (mouse.fdown && mouse.y >= hh)
        {
            tm = untransform(mouse.x, mouse.y);
            tmm = { x:cmod(tm.x, bs), y:cmod(tm.y, bs) };
            b = bget(tmm.x / bs, tmm.y / bs);
            
            downfloor = !isWall(b);
            painting = true;
        }
        
        if (painting && mouse.isdown)
        {
            if (mouse.y >= hh)
            {
                tm = untransform(mouse.x, mouse.y);
                tmm = { x:cmod(tm.x, bs), y:cmod(tm.y, bs) };
                
                if (downfloor)
                    bset(tmm.x / bs, tmm.y / bs, undefined);
                else
                    bset(tmm.x / bs, tmm.y / bs, new block("t"));
            }
        }
        else
            painting = false;
    }
    
    if (iskeydown(37))
        moveX(-sp);
    if (iskeydown(39))
        moveX(sp);
    
    if (iskeydown(38))
        moveY(-sp);
    if (iskeydown(40))
        moveY(sp);
}

function moveX(n)
{
    player.x += n;
    var vx = n > 0 ? player.x + player.width : player.x;
    
    var ba = bget(cmod(vx, bs) / bs, cmod(player.y, bs) / bs);
    var bb = bget(cmod(vx, bs) / bs, cmod(player.y + player.height, bs) / bs);
    
    if (isWall(ba) || isWall(bb))
        player.x = n > 0 ? cmod(vx, bs) - player.width - 2 : cmod(vx - n, bs) + 1;
    else if (ba.type == "cm" || bb.type == "cm")
        completeLevel();
}
function moveY(n)
{
    player.y += n;
    var vy = n > 0 ? player.y + player.height : player.y;
    
    var ba = bget(cmod(player.x, bs) / bs, cmod(vy, bs) / bs);
    var bb = bget(cmod(player.x + player.width, bs) / bs, cmod(vy, bs) / bs);
    
    if (isWall(ba) || isWall(bb))
        player.y = n > 0 ? cmod(vy, bs) - player.height - 1 : cmod(vy - n, bs) + 1;
    else if (ba.type == "cm" || bb.type == "cm")
        completeLevel();
}

function isWall(b)
{
    if (typeof b == "undefined" || typeof b.type == "undefined")
        return true;
    return b.type.indexOf("w") != -1;
}

function update()
{
    var e, b, c, r, p;
    
    var st = untransform(0, 0);
    var en = untransform(mc.width, mc.height);
    
    for (var x = cmod(st.x, bs); x < cmod(en.x + bs, bs); x += bs)
    {
        for (var y = cmod(st.y, bs); y < cmod(en.y + bs, bs); y += bs)
        {
            var cx = x / bs, cy = y / bs;
            b = bget(cx, cy);
            
            if (typeof b != "undefined")
            {
                var ty = b.type;
                r = new rectangle(x, y, bs, bs);
                
                // Surrounding tiles
                if (ty == "ta")
                    drawr(r, "white");
                else if (ty == "tb")
                    drawr(r, "#f9f9f9");
                else if (ty == "t")
                {
                    var iswhite = x % 64 == 0 && y % 64 != 0 || x % 64 != 0 && y % 64 == 0;
                    drawr(r, iswhite ? "white" : "#e5e5e5");
                }
                else if (ty == "cm" || ty == "sp")
                    drawr(r, "lightgreen");
                
                // Walls: one line per edge that touches floor (t, b, l, r).
                // Bottom and right lines are drawn twice as thick because the floor tile drawn after this one covers half of them.
                else if (isWall(b))
                {
                    if (ty.indexOf("t") != -1)
                        drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    if (ty.indexOf("b") != -1)
                        drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    if (ty.indexOf("l") != -1)
                        drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                    if (ty.indexOf("r") != -1)
                        drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                
            }
            
        }
    }
    
    if (won)
    {
        ctx.font = "bold 48px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "black";
        ctx.fillText("YOU WIN", mc.width / 2, mc.height / 2 - 20);
        ctx.font = "20px sans-serif";
        ctx.fillText(deaths + (deaths == 1 ? " death" : " deaths") + " in total", mc.width / 2, mc.height / 2 + 24);
        ctx.fillText("press any key to play again", mc.width / 2, mc.height / 2 + 56);
        return;
    }
    
    ctx.lineWidth = 2;
    drawr(player, "rgba(255, 50, 50, " + playerOpacity + ")", "rgba(0, 0, 0, " + playerOpacity + ")");
    
    ctx.lineWidth = 2;
    for (var i in enemies)
    {
        e = enemies[i];
        
        if (!levelCompleted && typeof e.step == "function")
        {
            e.step();
            
            if (colliderc(player, e.c))
                die();
        }
        else if (!levelCompleted)
        {
            var path = e.path;
            var ca = e.ca;
            
            var npx = path[ca];
            var npy = path[ca + 1];
            
            if (e.c.x < npx)
            {
                e.c.x += e.speed;
                if (e.c.x > npx)
                    e.c.x = npx;
            }
            else if (e.c.x > npx)
            {
                e.c.x -= e.speed;
                if (e.c.x < npx)
                    e.c.x = npx;
            }
            
            if (e.c.y < npy)
            {
                e.c.y += e.speed;
                if (e.c.y > npy)
                    e.c.y = npy;
            }
            else if (e.c.y > npy)
            {
                e.c.y -= e.speed;
                if (e.c.y < npy)
                    e.c.y = npy;
            }
            
            if (e.c.x == npx && e.c.y == npy)
                e.ca = (e.ca + 2) % path.length;
            
            if (colliderc(player, e.c))
                die();
        }
        
        drawc(e.c, "rgba(50, 50, 255, 1)", "black");
    }
}

function die()
{
    if (screenFadeOpacity != 0)
        return;
    if (isdead)
        return;
    
    isdead = true;
    deaths++;
    saveProgress();
    
    buffered.push(dieBuffer);
    buffered.push(isDeadBuffer);
}

function drawl(a, b, c, d, stroke, lw)
{
    ctx.beginPath();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw || 1;
    
    var pa = transform(a, b);
    var pb = transform(c, d);
    
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    
    ctx.stroke();
}

function drawr(r, fill, stroke)
{
    if (fill)
        ctx.fillStyle = fill;
    if (stroke)
        ctx.strokeStyle = stroke;
    
    var p = transform(r.x, r.y);
    var sx = r.width * camera.scale;
    var sy = r.height * camera.scale;
    
    if (fill)
        ctx.fillRect(p.x, p.y, sx, sy);
    if (stroke)
        ctx.strokeRect(p.x, p.y, sx, sy);
}

function drawc(c, fill, stroke)
{
    ctx.beginPath();
    if (fill)
        ctx.fillStyle = fill;
    if (stroke)
        ctx.strokeStyle = stroke;
    
    var p = transform(c.x, c.y);
    
    ctx.arc(p.x, p.y, c.radius * camera.scale, 0, 2 * Math.PI);
    
    if (fill)
        ctx.fill();
    if (stroke)
        ctx.stroke();
}

function clear()
{
    mc.width = mc.width;
}

//
function block(type)
{
    this.type = type || "generic";
}

function enemy(x, y, radius, path, speed)
{
    this.c = new circle(x, y, radius, "enemy");
    
    path.push(x, y);
    this.path = path;
    this.ca = 0;
    this.speed = speed || 1;
}
function orbiter(x, y, r, angle, speed, radius)    // An enemy that circles the point (x, y) at distance r; speed is in radians per frame
{
    this.x = x;
    this.y = y;
    this.r = r;
    this.angle = angle || 0;
    this.speed = speed || .03;
    this.c = new circle(x + Math.cos(this.angle) * r, y + Math.sin(this.angle) * r, radius || es, "enemy");
    
    this.step = function()
    {
        this.angle += this.speed;
        this.c.x = this.x + Math.cos(this.angle) * this.r;
        this.c.y = this.y + Math.sin(this.angle) * this.r;
    };
}
function rectangle(x, y, width, height, type)
{
    this.x = x || 0;
    this.y = y || 0;
    this.width = width || bs;
    this.height = height || bs;
    this.type = type || "generic";
}
function circle(x, y, radius, type)
{
    this.x = x || 0;
    this.y = y || 0;
    this.radius = radius || bs / 2;
    this.type = type || "generic";
}

function colliderr(a, b)
{
    return a.x + a.width > b.x && a.x < b.x + b.width && a.y + a.height > b.y && a.y < b.y + b.height;
}
function collidecc(a, b)
{
    return Math.sqrt(Math.pow(a.x - b.x) + Math.pow(a.y - b.y)) < a.radius + b.radius;
}
function colliderc(r, c)
{
    return pwithinc(r.x, r.y, c) ||
           pwithinc(r.x + r.width, r.y, c) ||
           pwithinc(r.x + r.width, r.y + r.height, c) ||
           pwithinc(r.x, r.y + r.height, c) ||
           
           pwithinr(c.x - c.radius, c.y, r) ||
           pwithinr(c.x + c.radius, c.y, r) ||
           pwithinr(c.x, c.y - c.radius, r) ||
           pwithinr(c.x, c.y + c.radius, r);
}

function pwithinr(x, y, r)
{
    return x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height;
}
function pwithinc(x, y, c)
{
    return Math.sqrt(Math.pow(c.x - x, 2) + Math.pow(c.y - y, 2)) < c.radius;
}

function transform(x, y)
{
    return {
        x:(x + mc.width / 2 - camera.x) * camera.scale - mc.width / 2,
        y:(y + mc.height / 2 - camera.y) * camera.scale - mc.height / 2
    };
}

function untransform(x, y)
{
    return {
        x:(x + mc.width / 2) / camera.scale + camera.x - mc.width / 2,
        y:(y + mc.height / 2) / camera.scale + camera.y - mc.height / 2
    };
}

function bget(x, y)
{
    return blocks[y * bl + x];
}
function bset(x, y, b)
{
    if (x instanceof Array)
    {
        for (var i = 0; i < x.length; i += 2)
            bset(x[i], x[i + 1], y);
        return;
    }
    
    blocks[y * bl + x] = b;
    
    // Walls are derived from the floor around them, so every tile touching this one is re-derived
    rewall(x, y);
    rewall(x, y - 1);
    rewall(x, y + 1);
    rewall(x - 1, y);
    rewall(x + 1, y);
}

function rewall(x, y)   // Turns a non-floor tile into a wall with one edge per neighbouring floor tile (or into nothing)
{
    if (isFloor(x, y))
        return;
    
    var ty = "";
    if (isFloor(x, y - 1))
        ty += "t";
    if (isFloor(x, y + 1))
        ty += "b";
    if (isFloor(x - 1, y))
        ty += "l";
    if (isFloor(x + 1, y))
        ty += "r";
    
    blocks[y * bl + x] = ty == "" ? undefined : new block(ty + "w");
}

function isFloor(x, y)
{
    var b = bget(x, y);
    return typeof b != "undefined" && !isWall(b);
}

function cmod(n, v)
{
    var m = mod(n, v);
    return n < 0 ? n - m - v : n - m;
}
function mod(n, v)
{
    return n % v;
}

var keydowns = [], pressed = [];
window.onkeydown = function(e)
{
    if (e.keyCode >= 37 && e.keyCode <= 40)
        e.preventDefault();
    
    if (keydowns.indexOf(e.keyCode) == -1)
    {
        keydowns.push(e.keyCode);
        pressed.push(e.keyCode);
    }
}
window.onkeyup = function(e)
{
    if (keydowns.indexOf(e.keyCode) != -1)
        keydowns.splice(keydowns.indexOf(e.keyCode), 1);
}
function iskeydown(kc)
{
    return keydowns.indexOf(typeof kc == "string" ? kc.charCodeAt(0) : kc) != -1;
}

// The bar above the play area
function barBoxes()     // One clickable box per level, plus one for the sandbox (n is what jump() takes)
{
    var boxes = [], w = 22, gap = 4, n = _levels.length + 1;
    var x = (mc.width - (n * w + (n - 1) * gap)) / 2;
    
    for (var i = 0; i < n; i++)
    {
        var r = new rectangle(x + i * (w + gap), (hh - w) / 2, w, w);
        r.n = i < _levels.length ? i : -1;
        r.label = i < _levels.length ? "" + (i + 1) : "S";
        boxes.push(r);
    }
    return boxes;
}

function bar()
{
    var i, r;
    
    ctx.fillStyle = "#1c1c1c";
    ctx.fillRect(0, 0, mc.width, hh);
    
    ctx.textBaseline = "middle";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    
    var title = won ? "YOU WIN" : clevel < 0 ? "SANDBOX" : "LEVEL " + (clevel + 1) + "/" + _levels.length;
    ctx.fillText(title, 12, hh / 2);
    
    ctx.textAlign = "right";
    ctx.fillText("DEATHS: " + deaths, mc.width - 12, hh / 2);
    
    var boxes = barBoxes();
    ctx.textAlign = "center";
    ctx.font = "bold 13px monospace";
    ctx.lineWidth = 1;
    
    for (i = 0; i < boxes.length; i++)
    {
        r = boxes[i];
        
        var current = r.n == clevel || (r.n == -1 && clevel == -1 && !won);
        var locked = r.n >= 0 && r.n > best;
        
        ctx.fillStyle = current ? "lightgreen" : locked ? "#333" : "#e5e5e5";
        ctx.fillRect(r.x, r.y, r.width, r.height);
        ctx.fillStyle = current ? "black" : locked ? "#666" : "#1c1c1c";
        ctx.fillText(r.label, r.x + r.width / 2, r.y + r.height / 2 + 1);
    }
    
    if (editing)
    {
        ctx.textAlign = "left";
        ctx.font = "bold 12px monospace";
        ctx.fillStyle = "yellow";
        ctx.fillText("EDIT", 12, hh - 8);
    }
    
    if (noticeTimer > 0)
    {
        noticeTimer--;
        ctx.textAlign = "center";
        ctx.font = "bold 13px monospace";
        var w = ctx.measureText(notice).width + 24;
        ctx.fillStyle = "rgba(0, 0, 0, .75)";
        ctx.fillRect((mc.width - w) / 2, mc.height - 40, w, 26);
        ctx.fillStyle = "white";
        ctx.fillText(notice, mc.width / 2, mc.height - 27);
    }
}

// Editor export: the current level as JS in the format of scripts/levels.js, to the console (and the clipboard when allowed)
function exportLevel()
{
    var tiles = {}, covered = {}, out = [], i, x, y, x1, y1, ok, e;
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    
    for (i in blocks)
    {
        if (!blocks[i] || isWall(blocks[i]))
            continue;
        
        x = ((i % bl) + bl) % bl;
        if (x >= bl / 2)
            x -= bl;
        y = (i - x) / bl;
        
        tiles[x + "," + y] = blocks[i].type;
        minx = Math.min(minx, x); maxx = Math.max(maxx, x);
        miny = Math.min(miny, y); maxy = Math.max(maxy, y);
    }
    
    function at(x, y)
    {
        return covered[x + "," + y] ? undefined : tiles[x + "," + y];
    }
    
    out.push('level("Untitled", function()');
    out.push('{');
    out.push('    spawn(' + Math.floor((resx + ps / 2) / bs) + ', ' + Math.floor((resy + ps / 2) / bs) + ');');
    out.push('    ');
    
    // Greedy rectangles of one tile type, biggest first row by row
    for (y = miny; y <= maxy; y++)
        for (x = minx; x <= maxx; x++)
        {
            var ty = at(x, y);
            if (!ty)
                continue;
            
            for (x1 = x; at(x1 + 1, y) == ty; x1++);
            for (y1 = y; ; y1++)
            {
                ok = true;
                for (i = x; i <= x1 && ok; i++)
                    if (at(i, y1 + 1) != ty)
                        ok = false;
                if (!ok)
                    break;
            }
            for (i = x; i <= x1; i++)
                for (var j = y; j <= y1; j++)
                    covered[i + "," + j] = true;
            
            out.push('    fill(' + x + ', ' + y + ', ' + x1 + ', ' + y1 + ', "' + ty + '");');
        }
    
    function w(v)   // A world coordinate as tc(n) when it is the middle of a tile
    {
        return (v - bs / 2) % bs == 0 ? "tc(" + (v - bs / 2) / bs + ")" : "" + v;
    }
    
    if (enemies.length)
        out.push('    ');
    for (i = 0; i < enemies.length; i++)
    {
        e = enemies[i];
        
        if (e.path)
        {
            var path = [];
            for (var j = 0; j < e.path.length - 2; j++)
                path.push(w(e.path[j]));
            
            out.push('    enemies.push(new enemy(' + w(e.path[e.path.length - 2]) + ', ' + w(e.path[e.path.length - 1]) + ', ' +
                     (e.c.radius == es ? 'es' : e.c.radius) + ', [' + path.join(', ') + '], ' + e.speed + '));');
        }
        else
            out.push('    enemies.push(new orbiter(' + w(e.x) + ', ' + w(e.y) + ', ' + e.r + ', ' + e.angle.toFixed(2) + ', ' + e.speed + '));');
    }
    
    out.push('});');
    
    var js = out.join("\n");
    console.log(js);
    
    try
    {
        navigator.clipboard.writeText(js).then(function(){ flash("LEVEL COPIED TO THE CLIPBOARD (and logged to the console)"); },
                                              function(){ flash("LEVEL LOGGED TO THE CONSOLE"); });
    }
    catch (err)
    {
        flash("LEVEL LOGGED TO THE CONSOLE");
    }
    
    return js;
}

// Buffer functions
var pc = 0, pl = 30;

function dieBuffer()
{
    playerOpacity -= .04;
    if (playerOpacity < 0)
    {
        playerOpacity = 0;
        return true;
    }
    return false;
}

function isDeadBuffer()
{
    if (playerOpacity == 0)
    {
        isdead = false;
        playerOpacity = 1;
        player.x = resx;
        player.y = resy;
        return true;
    }
    
    return false;
}

function fadeInBuffer()
{
    screenFadeOpacity -= .04;
    if (screenFadeOpacity < 0)
    {
        screenFadeOpacity = 0;
        if (typeof afterFadeIn == "function")
            afterFadeIn();
        return true;
    }
    
    return false;
}

function fadeOutBuffer()
{
    screenFadeOpacity += .04;
    if (screenFadeOpacity > 1)
    {
        screenFadeOpacity = 1;
        if (typeof afterFadeOut == "function")
            afterFadeOut();
        return true;
    }
    
    return false;
}

function pauseBuffer()
{
    pc++;
    if (pc > pl)
    {
        pc = 0;
        if (typeof afterPause == "function")
            afterPause();
        return true;
    }
    return false;
}
