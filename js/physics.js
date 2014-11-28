$(function() {
Physics(function (world) {

    var viewWidth = window.innerWidth
        ,viewHeight = window.innerHeight
        // center of the window
        ,center = Physics.vector(viewWidth, viewHeight).mult(0.5)
        // bounds of the window
        ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
        ,attractor
        ,edgeBounce
        ,renderer
        ;

    // create a renderer
    renderer = Physics.renderer('canvas', {
        el: 'viewport'
        ,width: viewWidth
        ,height: viewHeight
    });

    // add the renderer
    world.add(renderer);
    // render on each step
    world.on('step', function () {
        world.render();
    });

    // attract bodies to a point
    attractor = Physics.behavior('attractor', {
        pos: center
        ,strength: .1
        ,order: 1
    });

    // constrain objects to these bounds
    edgeBounce = Physics.behavior('edge-collision-detection', {
        aabb: viewportBounds
        ,restitution: 0.2
        ,cof: 0.8
    });

    // resize events
    window.addEventListener('resize', function () {

        viewWidth = window.innerWidth;
        viewHeight = window.innerHeight;

        renderer.el.width = viewWidth;
        renderer.el.height = viewHeight;

        viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);
        // update the boundaries
        edgeBounce.setAABB(viewportBounds);

    }, true);

    // move the attractor position to match the mouse coords
    renderer.el.addEventListener('mousemove', function( e ){
        attractor.position({ x: e.pageX, y: e.pageY });
    });

    // some fun colors
    var colors = [
        '#b58900',
        '#cb4b16',
        '#dc322f',
        '#d33682',
        '#6c71c4',
        '#268bd2',
        '#2aa198',
        '#859900'
    ];
    // create some bodies
    var l = 10;
    var bodies = [];
    var v = Physics.vector(0, 300);
    var b, r;

    while ( l-- ) {
        r = (20 + Math.random()*30)|0;
        b = Physics.body('circle', {
            radius: r
            ,mass: r
            ,x: v.x + center.x
            ,y: v.y + center.y
            ,vx: v.perp().mult(0.0001).x
            ,vx: v.y
            ,styles: {
                fillStyle: colors[ l % colors.length ]
            }
        });
        bodies.push(b);
        v.perp(true)
            .mult(10000)
            .rotate(l / 3);
    }

    // add things to the world
    world.add( bodies );
    world.add([
        Physics.behavior('newtonian', {
            strength: 0.005
            ,min: 10
        })
        ,Physics.behavior('body-impulse-response')
        ,edgeBounce
        ,attractor
    ]);

    // subscribe to ticker to advance the simulation
    Physics.util.ticker.on(function( time ) {
        world.step( time );
    });

    // start the ticker
    Physics.util.ticker.start();
});
});
