// World's Hardest Game Remake
// By Steven Geeky

// Modifiable Declarations
var _levels = [], clevel = 0, playerOpacity = 1, screenFadeOpacity = 0;
var requestNextLevel = false;
var afterPause;

// ////////////////////////////
var mc, ctx;

var player, enemies = [], levelCompleted = false;
var blocks = [], bs = 32, bl = 256;

var reform = false;
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

// ///////////////////////////////

window.onload = function()
{
    mc = document.createElement("canvas");
    ctx = mc.getContext("2d");
    
    document.body.style.background = "black";
    
    mc.width = 640;
    mc.height = 480;
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
    camera.y = -mc.height / 2;
    
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

function goto(n)
{
    var nl = _levels[n];
    
    if (typeof nl == "function")
    {
        clevel = n;
        nl();
    }
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
    
    mouse.fdown = false;
    mouse.fup = true;
    reform = false;
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
    if (isdead || levelCompleted)
        return;
    
    var sp = 2;
    var tm, tmm, b;
    
    if (mouse.fdown)
    {
        tm = untransform(mouse.x, mouse.y);
        tmm = { x:cmod(tm.x, bs), y:cmod(tm.y, bs) };
        
        if (mouse.which == 1)
        {
            b = bget(tmm.x / bs, tmm.y / bs);
            
            if (!isWall(b))
                downfloor = true;
            else
                downfloor = false;
        }
    }
    
    if (mouse.isdown)
    {
        tm = untransform(mouse.x, mouse.y);
        tmm = { x:cmod(tm.x, bs), y:cmod(tm.y, bs) };
        b = bget(tmm.x / bs, tmm.y / bs);
        
        if (downfloor)
            bset(tmm.x / bs, tmm.y / bs, undefined);
        else if (!downfloor)
            bset(tmm.x / bs, tmm.y / bs, new block("t"));
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
            
            if (reform && !isWall(b))
                bset(cx, cy, b)
            
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
                else if (ty == "cm")
                    drawr(r, "lightgreen");
                
                // Walls
                else if (ty == "tw")
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                else if (ty == "bw")
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                else if (ty == "rw")
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                else if (ty == "lw")
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                
                else if (ty == "brw")
                {
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                else if (ty == "trw")
                {
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                else if (ty == "blw")
                {
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                }
                else if (ty == "tlw")
                {
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                }
                
                else if (ty == "tbw")
                {
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                else if (ty == "lrw")
                {
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                
                //
                else if (ty == "lbrw")
                {
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                else if (ty == "brtw")
                {
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                }
                else if (ty == "rtlw")
                {
                    drawl(r.x + r.width, r.y, r.x + r.width, r.y + r.height, "black", wlw * 2);
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                }
                else if (ty == "tlbw")
                {
                    drawl(r.x, r.y, r.x + r.width, r.y, "black", wlw);
                    drawl(r.x, r.y, r.x, r.y + r.height, "black", wlw);
                    drawl(r.x, r.y + r.height, r.x + r.width, r.y + r.height, "black", wlw * 2);
                }
                
            }
            
        }
    }
    
    ctx.lineWidth = 2;
    drawr(player, "rgba(255, 50, 50, " + playerOpacity + ")", "rgba(0, 0, 0, " + playerOpacity + ")");
    
    ctx.lineWidth = 2;
    for (var i in enemies)
    {
        e = enemies[i];
        
        if (!levelCompleted)
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
function bset(x, y, b, ov)
{
    if (x instanceof Array)
        for (var i = 0; i < x.length; i += 2)
            bset(x[i], x[i + 1], y);
    
    var tb = b;
    if (typeof tb != "undefined")
    {
        if (tb.type == "t" || tb.type == "ta" || tb.type == "tb" || tb.type == "cm")
        {
            if (isntFloor(x, y - 1))
            {
                /*if (!isntFloor(x + 1, y - 1) && !isntFloor(x - 1, y - 1) && isntFloor(x, y - 2))
                    bset(x, y - 1, new block("lbrw"));
                else if (!isntFloor(x, y - 2) && !isntFloor(x - 1, y - 1) && isntFloor(x + 1, y - 1))
                    bset(x, y - 1, new block("tlbw"));
                else if (!isntFloor(x, y - 2) && !isntFloor(x + 1, y - 1) && isntFloor(x - 1, y - 1))
                    bset(x, y - 1, new block("brtw"));
                */
                /*else if (!isntFloor(x, y - 2) && isntFloor(x + 1, y - 1) && isntFloor(x - 1, y - 1))
                    bset(x, y - 1, new block("tbw"));
                */
                if (!isntFloor(x + 1, y - 1))
                    bset(x, y - 1, new block("brw"));
                else if (!isntFloor(x - 1, y - 1))
                    bset(x, y - 1, new block("blw"));
                else
                    bset(x, y - 1, new block("bw"));
            }
            if (isntFloor(x, y + 1))
            {
                /*if (!isntFloor(x - 1, y + 1) && !isntFloor(x + 1, y + 1) && isntFloor(x, y + 2))
                    bset(x, y + 1, new block("rtlw"));
                else if (!isntFloor(x, y + 2) && !isntFloor(x + 1, y + 1) && isntFloor(x - 1, y + 1))
                    bset(x, y + 1, new block("brtw"));
                else if (!isntFloor(x, y + 2) && !isntFloor(x - 1, y + 1) && isntFloor(x + 1, y + 1))
                    bset(x, y + 1, new block("tlbw"));
                */
                /*else if (!isntFloor(x, y + 2) && isntFloor(x + 1, y + 1) && isntFloor(x - 1, y + 1))
                    bset(x, y + 1, new block("tbw"));
                */
                if (!isntFloor(x - 1, y + 1))
                    bset(x, y + 1, new block("tlw"));
                else if (!isntFloor(x + 1, y + 1))
                    bset(x, y + 1, new block("trw"));
                else
                    bset(x, y + 1, new block("tw"));
            }
            if (isntFloor(x - 1, y))
            {
                /*if (!isntFloor(x - 1, y - 1) && !isntFloor(x - 1, y + 1) && isntFloor(x - 2, y))
                    bset(x - 1, y, new block("brtw"));
                else if (!isntFloor(x - 2, y) && !isntFloor(x - 1, y - 1) && isntFloor(x - 1, y + 1))
                    bset(x - 1, y, new block("rtlw"));
                else if (!isntFloor(x - 2, y) && !isntFloor(x - 1, y + 1) && isntFloor(x - 1, y - 1))
                    bset(x - 1, y, new block("lbrw"));
                */
                /*else if (!isntFloor(x - 2, y) && isntFloor(x - 1, y + 1) && isntFloor(x - 1, y - 1))
                    bset(x - 1, y, new block("lrw"));
                */
                if (!isntFloor(x - 1, y - 1))
                    bset(x - 1, y, new block("trw"));
                else if (!isntFloor(x - 1, y + 1))
                    bset(x - 1, y, new block("brw"));
                else
                    bset(x - 1, y, new block("rw"));
            }
            if (isntFloor(x + 1, y))
            {
                /*if (!isntFloor(x + 1, y - 1) && !isntFloor(x + 1, y + 1) && isntFloor(x + 2, y))
                    bset(x + 1, y, new block("tlbw"));
                else if (!isntFloor(x + 2, y) && !isntFloor(x + 1, y - 1) && isntFloor(x + 1, y + 1))
                    bset(x + 1, y, new block("tlbw"));
                else if (!isntFloor(x + 2, y) && !isntFloor(x + 1, y + 1) && isntFloor(x + 1, y - 1))
                    bset(x + 1, y, new block("lbrw"));
                */
                /*else if (!isntFloor(x + 2, y) && isntFloor(x + 1, y - 1) && isntFloor(x + 1, y + 1))
                    bset(x + 1, y, new block("lrw"));
                */
                if (!isntFloor(x + 1, y - 1))
                    bset(x + 1, y, new block("tlw"));
                else if (!isntFloor(x + 1, y + 1))
                    bset(x + 1, y, new block("blw"));
                else
                    bset(x + 1, y, new block("lw"));
            }
        }
    }
    else if (!ov && (isWall(bget(x - 1, y)) || isWall(bget(x + 1, y)) || isWall(bget(x, y - 1)) || isWall(bget(x, y + 1))) )
    {
        if (bget(x - 1, y) != undefined)
        {
            if (bget(x - 1, y).type.replace(/lbrw|brtw|rtlw/g, "") == "")
                bset(x - 1, y, undefined);
            
            else if (bget(x - 1, y).type == "brw")
                bset(x - 1, y, new block("bw"));
            else if (bget(x - 1, y).type == "trw")
                bset(x - 1, y, new block("tw"));
            else if (bget(x - 1, y).type == "rw")
                bset(x - 1, y, undefined, true);
            reform = true;
        }
        if (bget(x, y - 1) != undefined)
        {
            if (bget(x, y - 1).type.replace(/tlbw|lbrw|brtw/g, "") == "")
                bset(x, y - 1, undefined);
            
            else if (bget(x, y - 1).type == "brw")
                bset(x, y - 1, new block("rw"));
            else if (bget(x, y - 1).type == "blw")
                bset(x, y - 1, new block("lw"));
            else if (bget(x, y - 1).type == "bw")
                bset(x, y - 1, undefined, true);
            reform = true;
        }
        if (bget(x + 1, y) != undefined)
        {
            if (bget(x + 1, y).type.replace(/rtlw|tlbw|lbrw/g, "") == "")
                bset(x + 1, y, undefined);
            
            else if (bget(x + 1, y).type == "tlw")
                bset(x + 1, y, new block("tw"));
            else if (bget(x + 1, y).type == "blw")
                bset(x + 1, y, new block("bw"));
            else if (bget(x + 1, y).type == "lw")
                bset(x + 1, y, undefined, true);
            reform = true;
        }
        if (bget(x, y + 1) != undefined)
        {
            if (bget(x, y + 1).type.replace(/tlbw|lbrw|brtw/g, "") == "")
                bset(x, y + 1, undefined, true);
            
            else if (bget(x, y + 1).type == "tlw")
                bset(x, y + 1, new block("lw"));
            else if (bget(x, y + 1).type == "trw")
                bset(x, y + 1, new block("rw"));
            else if (bget(x, y + 1).type == "tw")
                bset(x, y + 1, undefined, true);
            reform = true;
        }
    }
    
    blocks[y * bl + x] = b;
}

function isntFloor(x, y)
{
    var b = bget(x, y);
    
    if (typeof b != "undefined") {
        return b.type.replace(/tw|bw|lw|rw|trw|brw|tlw|blw/g, "") == "";
    }
    return true;
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

var keydowns = [];
window.onkeydown = function(e)
{
    if (keydowns.indexOf(e.keyCode) == -1)
        keydowns.push(e.keyCode);
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