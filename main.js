var shouldBeFlat = true; // set this to restrict to a 2d plane
var numPoints = 20000; //50000,//16384;
var allocation = 16000; // render in point batches
    
// Load mathbox with controls
var mathbox = mathBox({
    plugins: ['core', 'cursor', 'controls'],
    controls: {
        klass: THREE.OrbitControls,
    },
});
if (mathbox.fallback) throw "WebGL error";

var a = 0.0529,
    a2 = a * a,
    pi = Math.PI;

// Helpers
function p(x) {
    return (4 * x * x) / Math.pow(a, 3) * Math.exp(-2 * x / a)
}

function P(x) {
    return 1 - 2 / a2 * Math.exp(-2 * x / a) * (x * x + a * x + a2 * 0.5);
}

function randRad(target) {
    //WARNING: random is 1 exclusive

    var attempt = target,
        up = 1,
        dn = 0;

    //inverse of P too hard, so binary search for the answer
    for (var i = 0; i < 20; i++) {
        if (P(attempt) > target) up = attempt;
        else dn = attempt;

        attempt = dn + (up - dn) * 0.5;
    }
    return attempt;
}

function genPoints() {
    var points = [],
        loopPoints = [],
        total = 0;

    for (var p = 0; p < numPoints / allocation; p += 1) {
        points.push([]);

        for (var t = 0; t < allocation; t++) {

            // Guess at values in bounds
            var r = 0, theta = 0, z = 0;
            do {
                r = randRad(Math.pow(Math.random(), 0.3333333333333333));
                theta = Math.acos(Math.random() * 2 - 1);
                z = r * Math.cos(theta);
            } while (shouldBeFlat && Math.abs(z) > 0.01);

            total += r;
            var phi = Math.random() * 2 * pi;
            points[p].push(
                r * Math.sin(theta) * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi), z);
        }
    }

    console.log("Ave: " + String(total / numPoints));
    // Why is this incorrect?


    return points;
}

function main() {

    // Set renderer background
    var three = mathbox.three;
    three.renderer.setClearColor(new THREE.Color(0xffffff), 1.0);

    // Set mathbox units and place camera
    mathbox.set({
        scale: 720,
        focus: 3
    });
    mathbox.camera({
        proxy: true,
        position: [0, 0, 1]
    });

    // Create cartesian view
    var view = mathbox.cartesian({
        range: [[-0.5, 0.5], [-0.5, 0.5], [-0.5, 0.5]],
        scale: [1, 1, 1],
        rotation: [0, 0, 0], //Math.PI/2
    });

    // Gen points
    var points = genPoints();

    view.array({
        data: [0, 0],
        channels: 2,
        live: false,
    }).point({
        size: 3.5,
        color: 'black'
    });

    for (var cut = 0; cut < points.length; cut++) {
        view.array({
            data: points[cut],
            channels: 3,
            live: false,
            id: 'array' + cut,
        }).point({
            size: 0.5,
            color: 'grey',
        });
    }

    // rings
    if (shouldBeFlat)
        for (var i = 1; i <= 5; i++) {
            view.interval({
                width: 40 + i * 2,
                channels: 3,
                items: 2,
                expr: (function (n) {
                    return function (emit, x, i, t) {
                        ans = [Math.cos(x * pi * 2) * a * n, Math.sin(x * pi * 2) * a * n, (1 - P(a * n)) * 0.2];
                        emit.apply(emit, ans);
                        ans[2] *= -1;
                        emit.apply(emit, ans);
                    };
                }(i)),
            }).vector({
                width: 2,
                color: '#3090FF',
                opacity: 0.5,
            });
        }
}

main();
