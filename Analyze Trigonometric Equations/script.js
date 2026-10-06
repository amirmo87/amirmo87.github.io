/* =========================================================
   AMIRMO
   Trigonometric Equation Analyzer
   ========================================================= */


/* =========================================================
   DOM
   ========================================================= */

const equationInput =
    document.getElementById("equationInput");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const errorMessage =
    document.getElementById("errorMessage");

const unitCircleCanvas =
    document.getElementById("unitCircleCanvas");

const graphCanvas =
    document.getElementById("graphCanvas");

const circleSolutions =
    document.getElementById("circleSolutions");

const solutionCount =
    document.getElementById("solutionCount");

const intersectionList =
    document.getElementById("intersectionList");

const periodSolutions =
    document.getElementById("periodSolutions");

const generalSolutions =
    document.getElementById("generalSolutions");

const periodRange =
    document.getElementById("periodRange");


/* =========================================================
   CONSTANTS
   ========================================================= */

const PI = Math.PI;

const TWO_PI = 2 * Math.PI;

const ROOT_TOLERANCE = 1e-7;

const MERGE_TOLERANCE = 1e-5;


/* =========================================================
   MATH.JS CONFIGURATION
   ========================================================= */

math.config({
    number: "number"
});


/* =========================================================
   BASIC UTILITIES
   ========================================================= */

function normalizeZero(value) {

    if (Math.abs(value) < 1e-10) {
        return 0;
    }

    return value;
}


function normalizeAngle(angle, period = TWO_PI) {

    let result = angle % period;

    if (result < 0) {
        result += period;
    }

    if (Math.abs(result - period) < MERGE_TOLERANCE) {
        return 0;
    }

    return result;
}


function formatDecimal(value, digits = 5) {

    value = normalizeZero(value);

    if (
        Math.abs(value - Math.round(value))
        < 1e-8
    ) {
        return String(Math.round(value));
    }

    return value
        .toFixed(digits)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}


/* =========================================================
   ANGLE → EXACT LATEX
   ========================================================= */

function angleToLatex(angle, period = TWO_PI) {

    angle =
        normalizeAngle(
            angle,
            period
        );


    /*
       Important exact angles.
    */

    const candidates = [

        [0, "0"],

        [PI / 6, "\\frac{\\pi}{6}"],

        [PI / 4, "\\frac{\\pi}{4}"],

        [PI / 3, "\\frac{\\pi}{3}"],

        [PI / 2, "\\frac{\\pi}{2}"],

        [2 * PI / 3, "\\frac{2\\pi}{3}"],

        [3 * PI / 4, "\\frac{3\\pi}{4}"],

        [5 * PI / 6, "\\frac{5\\pi}{6}"],

        [PI, "\\pi"],

        [7 * PI / 6, "\\frac{7\\pi}{6}"],

        [5 * PI / 4, "\\frac{5\\pi}{4}"],

        [4 * PI / 3, "\\frac{4\\pi}{3}"],

        [3 * PI / 2, "\\frac{3\\pi}{2}"],

        [5 * PI / 3, "\\frac{5\\pi}{3}"],

        [7 * PI / 4, "\\frac{7\\pi}{4}"],

        [11 * PI / 6, "\\frac{11\\pi}{6}"]

    ];


    for (const [value, latex] of candidates) {

        if (
            Math.abs(angle - value)
            < MERGE_TOLERANCE
        ) {

            return latex;

        }

    }


    /*
       Search rational multiples of π.
    */

    const ratio =
        angle / PI;


    for (
        let denominator = 1;
        denominator <= 48;
        denominator++
    ) {

        const numerator =
            Math.round(
                ratio * denominator
            );


        if (
            Math.abs(
                ratio -
                numerator / denominator
            ) < 0.00008
        ) {

            if (numerator === 0) {
                return "0";
            }


            if (denominator === 1) {

                if (numerator === 1) {
                    return "\\pi";
                }

                return `${numerator}\\pi`;

            }


            const sign =
                numerator < 0 ? "-" : "";

            const n =
                Math.abs(numerator);


            if (n === 1) {

                return `${sign}\\frac{\\pi}{${denominator}}`;

            }


            return `${sign}\\frac{${n}\\pi}{${denominator}}`;

        }

    }


    /*
       Generic numerical angle.
    */

    return formatDecimal(angle);

}


/* =========================================================
   LATEX RENDERING
   ========================================================= */

function renderMath(latex) {

    return katex.renderToString(
        latex,
        {
            throwOnError: false,
            displayMode: false
        }
    );

}


/* =========================================================
   PERIOD DETECTION
   ========================================================= */

function detectPeriod(ascii) {

    const s =
        ascii
            .replace(/\s/g, "")
            .toLowerCase();


    /*
       Pure tangent / cotangent expressions
       have π as a natural period.
    */

    const hasTan =
        s.includes("tan") ||
        s.includes("cot");


    const hasSin =
        s.includes("sin");


    const hasCos =
        s.includes("cos");


    /*
       If only tan/cot occurs:
       π is enough.
    */

    if (
        hasTan &&
        !hasSin &&
        !hasCos
    ) {

        return PI;

    }


    /*
       Squared sine/cosine often has π period.
       This is a useful exact special case.
    */

    const hasSquaredTrig =
        /(?:sin|cos)\([^)]*\)\^2/.test(s);


    if (
        hasSquaredTrig &&
        !hasTan
    ) {

        return PI;

    }


    /*
       Universal safe period for combinations
       of sin/cos/tan.
    */

    return TWO_PI;
}


/* =========================================================
   PARSE EQUATION
   ========================================================= */

function parseEquation() {

    /*
       MathLive officially supports ASCII Math output.
    */

    const ascii =
        equationInput.getValue("ascii-math");


    if (
        !ascii ||
        ascii.trim() === ""
    ) {

        throw new Error(
            "Please enter a trigonometric equation."
        );

    }


    const equalIndex =
        ascii.indexOf("=");


    if (equalIndex === -1) {

        throw new Error(
            "Please use an equality sign = between the two sides."
        );

    }


    const left =
        ascii
            .substring(0, equalIndex)
            .trim();


    const right =
        ascii
            .substring(equalIndex + 1)
            .trim();


    if (!left || !right) {

        throw new Error(
            "Both sides of the equation are required."
        );

    }


    /*
       Make sure x is actually present.
    */

    if (
        !/[xX]/.test(left + right)
    ) {

        throw new Error(
            "The equation must contain the variable x."
        );

    }


    /*
       Check that this is actually
       trigonometric mathematics.
    */

    const trig =
        /(sin|cos|tan|cot|sec|csc)/i
            .test(left + right);


    if (!trig) {

        throw new Error(
            "Please enter a trigonometric equation."
        );

    }


    return {

        ascii,

        left,

        right,

        period:
            detectPeriod(ascii)

    };

}


/* =========================================================
   COMPILE EXPRESSIONS WITH MATH.JS
   ========================================================= */

function compileExpression(expression) {

    try {

        /*
           math.js understands:
           sin, cos, tan, sqrt,
           fractions, powers and π.
        */

        const node =
            math.parse(expression);


        const compiled =
            node.compile();


        return function (x) {

            try {

                const value =
                    compiled.evaluate({
                        x: x
                    });


                /*
                   math.js may return complex numbers.
                   We only accept real values.
                */

                if (
                    typeof value === "number" &&
                    Number.isFinite(value)
                ) {

                    return value;

                }


                if (
                    value &&
                    typeof value.re === "number" &&
                    Math.abs(value.im || 0)
                    < 1e-12
                ) {

                    return value.re;

                }


                return NaN;

            } catch {

                return NaN;

            }

        };

    } catch (error) {

        throw new Error(
            `Could not interpret "${expression}".`
        );

    }

}


/* =========================================================
   DIFFERENCE FUNCTION
   ========================================================= */

function makeDifference(equation) {

    const left =
        compileExpression(
            equation.left
        );


    const right =
        compileExpression(
            equation.right
        );


    return {

        left,

        right,

        difference(x) {

            const a = left(x);

            const b = right(x);


            if (
                !Number.isFinite(a) ||
                !Number.isFinite(b)
            ) {

                return NaN;

            }


            return a - b;

        }

    };

}


/* =========================================================
   BISECTION
   ========================================================= */

function bisection(func, a, b) {

    let fa = func(a);

    let fb = func(b);


    if (
        !Number.isFinite(fa) ||
        !Number.isFinite(fb)
    ) {

        return NaN;

    }


    if (Math.abs(fa) < ROOT_TOLERANCE) {
        return a;
    }


    if (Math.abs(fb) < ROOT_TOLERANCE) {
        return b;
    }


    for (let i = 0; i < 70; i++) {

        const mid =
            (a + b) / 2;


        const fm =
            func(mid);


        if (!Number.isFinite(fm)) {
            return NaN;
        }


        if (
            Math.abs(fm)
            < ROOT_TOLERANCE
        ) {

            return mid;

        }


        if (fa * fm < 0) {

            b = mid;

            fb = fm;

        } else {

            a = mid;

            fa = fm;

        }

    }


    return (a + b) / 2;

}


/* =========================================================
   ROOT SEARCH
   ========================================================= */

function findRoots(
    func,
    min,
    max,
    steps = 30000
) {

    const roots = [];

    const dx =
        (max - min) / steps;


    let previousX = min;

    let previousY =
        func(previousX);


    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const x =
            min + i * dx;


        const y =
            func(x);


        /*
           Ordinary crossing root.
        */

        if (
            Number.isFinite(previousY) &&
            Number.isFinite(y)
        ) {

            if (
                previousY === 0 ||
                previousY * y < 0
            ) {

                const root =
                    previousY === 0
                        ? previousX
                        : bisection(
                            func,
                            previousX,
                            x
                        );


                if (
                    Number.isFinite(root)
                ) {

                    roots.push(root);

                }

            }

        }


        previousX = x;

        previousY = y;

    }


    /*
       Second pass:
       detect roots that only TOUCH zero
       instead of crossing it.

       This is important for equations such as

       sin²(x) = 0
    */

    const localSteps =
        Math.min(steps, 12000);


    const localDx =
        (max - min) / localSteps;


    let x0 = min;

    let y0 = func(x0);


    let x1 =
        x0 + localDx;

    let y1 =
        func(x1);


    for (
        let i = 1;
        i < localSteps - 1;
        i++
    ) {

        const x2 =
            x1 + localDx;


        const y2 =
            func(x2);


        if (
            Number.isFinite(y0) &&
            Number.isFinite(y1) &&
            Number.isFinite(y2)
        ) {

            /*
               Local minimum.
            */

            if (
                Math.abs(y1) <=
                Math.abs(y0) &&

                Math.abs(y1) <=
                Math.abs(y2) &&

                Math.abs(y1) < 0.002
            ) {

                const root =
                    refineMinimum(
                        func,
                        x0,
                        x2
                    );


                if (
                    Number.isFinite(root) &&
                    Math.abs(func(root))
                    < 1e-5
                ) {

                    roots.push(root);

                }

            }

        }


        x0 = x1;

        y0 = y1;

        x1 = x2;

        y1 = y2;

    }


    /*
       Sort.
    */

    roots.sort(
        (a, b) => a - b
    );


    /*
       Normalize and merge.
    */

    const unique = [];


    for (const root of roots) {

        const r =
            normalizeAngle(
                root,
                max - min
            );


        if (
            unique.length === 0 ||
            Math.abs(
                r -
                unique[
                    unique.length - 1
                ]
            ) > MERGE_TOLERANCE
        ) {

            unique.push(r);

        }

    }


    /*
       If first and last represent the same
       circular point, keep one.
    */

    if (
        unique.length > 1 &&
        Math.abs(
            unique[0] +
            (max - min) -
            unique[unique.length - 1]
        ) < MERGE_TOLERANCE
    ) {

        unique.pop();

    }


    return unique;

}


/* =========================================================
   REFINE TANGENTIAL ROOT
   ========================================================= */

function refineMinimum(
    func,
    a,
    b
) {

    /*
       Golden-section search on |f(x)|.
    */

    const phi =
        (1 + Math.sqrt(5)) / 2;


    let left = a;

    let right = b;


    for (let i = 0; i < 60; i++) {

        const c =
            right -
            (right - left) / phi;


        const d =
            left +
            (right - left) / phi;


        const fc =
            Math.abs(func(c));


        const fd =
            Math.abs(func(d));


        if (fc < fd) {

            right = d;

        } else {

            left = c;

        }

    }


    return (left + right) / 2;

}


/* =========================================================
   EXACT SPECIAL CASE DETECTOR
   ========================================================= */

function exactAngleCandidates() {

    return [

        0,

        PI / 6,

        PI / 4,

        PI / 3,

        PI / 2,

        2 * PI / 3,

        3 * PI / 4,

        5 * PI / 6,

        PI,

        7 * PI / 6,

        5 * PI / 4,

        4 * PI / 3,

        3 * PI / 2,

        5 * PI / 3,

        7 * PI / 4,

        11 * PI / 6

    ];

}


/*
   Replace numerical roots with the exact familiar
   angle whenever they are extremely close.
*/

function snapRootsToExact(roots) {

    const candidates =
        exactAngleCandidates();


    return roots.map(root => {

        for (const candidate of candidates) {

            if (
                Math.abs(
                    root - candidate
                ) < 1e-5
            ) {

                return candidate;

            }

        }


        return root;

    });

}


/* =========================================================
   UNIT CIRCLE
   ========================================================= */

function drawUnitCircle(
    roots,
    period
) {

    const canvas =
        unitCircleCanvas;

    const ctx =
        canvas.getContext("2d");


    const W =
        canvas.width;

    const H =
        canvas.height;


    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    ctx.fillStyle =
        "#07111f";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    const cx =
        W / 2;


    const cy =
        H / 2;


    const radius =
        215;


    /*
       Concentric grid
    */

    ctx.strokeStyle =
        "rgba(109,168,255,0.07)";

    ctx.lineWidth = 1;


    for (
        let r = 50;
        r <= radius;
        r += 50
    ) {

        ctx.beginPath();

        ctx.arc(
            cx,
            cy,
            r,
            0,
            TWO_PI
        );

        ctx.stroke();

    }


    /*
       Axes
    */

    ctx.strokeStyle =
        "rgba(109,168,255,0.32)";


    ctx.beginPath();

    ctx.moveTo(
        cx - radius - 35,
        cy
    );

    ctx.lineTo(
        cx + radius + 35,
        cy
    );

    ctx.stroke();


    ctx.beginPath();

    ctx.moveTo(
        cx,
        cy - radius - 35
    );

    ctx.lineTo(
        cx,
        cy + radius + 35
    );

    ctx.stroke();


    /*
       Circle
    */

    ctx.strokeStyle =
        "#6da8ff";

    ctx.lineWidth = 2;


    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        radius,
        0,
        TWO_PI
    );

    ctx.stroke();


    /*
       Standard angle labels
    */

    ctx.fillStyle =
        "#9bc5ff";

    ctx.font =
        "16px 'DM Mono', monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    const labels = [

        [0, "0"],

        [PI / 2, "π/2"],

        [PI, "π"],

        [3 * PI / 2, "3π/2"]

    ];


    labels.forEach(
        ([angle, label]) => {

            const x =
                cx +
                (radius + 38) *
                Math.cos(angle);


            const y =
                cy -
                (radius + 38) *
                Math.sin(angle);


            ctx.fillText(
                label,
                x,
                y
            );

        }
    );


    /*
       Solution points.
    */

    roots.forEach(
        (angle, index) => {

            const normalized =
                period === TWO_PI
                    ? angle
                    : angle;


            const visualAngle =
                normalized;


            const x =
                cx +
                radius *
                Math.cos(
                    visualAngle
                );


            const y =
                cy -
                radius *
                Math.sin(
                    visualAngle
                );


            /*
               Glow
            */

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                15,
                0,
                TWO_PI
            );

            ctx.fillStyle =
                "rgba(109,168,255,0.12)";

            ctx.fill();


            /*
               Point
            */

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                6,
                0,
                TWO_PI
            );

            ctx.fillStyle =
                "#edf4ff";

            ctx.fill();


            /*
               Number
            */

            ctx.fillStyle =
                "#9bc5ff";

            ctx.font =
                "14px 'DM Mono', monospace";

            ctx.fillText(
                String(index + 1),
                x + 17,
                y - 17
            );

        }
    );


    /*
       Center
    */

    ctx.beginPath();

    ctx.arc(
        cx,
        cy,
        4,
        0,
        TWO_PI
    );

    ctx.fillStyle =
        "#6da8ff";

    ctx.fill();

}


/* =========================================================
   CIRCLE SOLUTION LIST
   ========================================================= */

function displayCircleSolutions(
    roots,
    period
) {

    solutionCount.textContent =
        roots.length;


    circleSolutions.innerHTML = "";


    if (roots.length === 0) {

        circleSolutions.innerHTML =
            `
            <div class="solution-item">
                No real solution found in this period.
            </div>
            `;

        return;

    }


    roots.forEach(
        (root, index) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "solution-item";


            const latex =
                angleToLatex(
                    root,
                    period
                );


            item.innerHTML =
                `
                x_{${index + 1}}
                =
                ${renderMath(latex)}
                `;


            circleSolutions.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   GRAPH
   ========================================================= */

function drawGraph(
    equation,
    functions,
    roots,
    period
) {

    const canvas =
        graphCanvas;

    const ctx =
        canvas.getContext("2d");


    const W =
        canvas.width;

    const H =
        canvas.height;


    ctx.clearRect(
        0,
        0,
        W,
        H
    );


    ctx.fillStyle =
        "#07111f";

    ctx.fillRect(
        0,
        0,
        W,
        H
    );


    /*
       Wider domain.

       Instead of only [0,2π],
       show several periods.
    */

    const xmin =
        period === PI
            ? -3 * PI
            : -2 * PI;


    const xmax =
        period === PI
            ? 3 * PI
            : 4 * PI;


    /*
       Wider range.
    */

    const ymin = -5;

    const ymax = 5;


    function xToPixel(x) {

        return (
            (x - xmin) /
            (xmax - xmin)
        ) * W;

    }


    function yToPixel(y) {

        return H -
            (
                (y - ymin) /
                (ymax - ymin)
            ) * H;

    }


    /*
       Grid.
    */

    ctx.strokeStyle =
        "rgba(109,168,255,0.07)";

    ctx.lineWidth = 1;


    const xStep =
        PI / 2;


    for (
        let x = Math.ceil(xmin / xStep) * xStep;
        x <= xmax;
        x += xStep
    ) {

        const px =
            xToPixel(x);


        ctx.beginPath();

        ctx.moveTo(
            px,
            0
        );

        ctx.lineTo(
            px,
            H
        );

        ctx.stroke();

    }


    for (
        let y = Math.ceil(ymin);
        y <= ymax;
        y++
    ) {

        const py =
            yToPixel(y);


        ctx.beginPath();

        ctx.moveTo(
            0,
            py
        );

        ctx.lineTo(
            W,
            py
        );

        ctx.stroke();

    }


    /*
       Main axes.
    */

    ctx.strokeStyle =
        "rgba(109,168,255,0.35)";

    ctx.lineWidth = 1.5;


    if (
        ymin <= 0 &&
        ymax >= 0
    ) {

        const py =
            yToPixel(0);


        ctx.beginPath();

        ctx.moveTo(
            0,
            py
        );

        ctx.lineTo(
            W,
            py
        );

        ctx.stroke();

    }


    const px0 =
        xToPixel(0);


    ctx.beginPath();

    ctx.moveTo(
        px0,
        0
    );

    ctx.lineTo(
        px0,
        H
    );

    ctx.stroke();


    /*
       Function drawer.
    */

    function drawFunction(
        fn,
        lineWidth
    ) {

        ctx.strokeStyle =
            "#6da8ff";

        ctx.lineWidth =
            lineWidth;

        ctx.beginPath();


        let started = false;

        let previousY =
            null;


        const samples =
            7000;


        for (
            let i = 0;
            i <= samples;
            i++
        ) {

            const x =
                xmin +
                (
                    i / samples
                ) *
                (xmax - xmin);


            const y =
                fn(x);


            if (
                !Number.isFinite(y) ||
                Math.abs(y) > 100
            ) {

                started = false;

                previousY = null;

                continue;

            }


            const px =
                xToPixel(x);


            const py =
                yToPixel(y);


            /*
               Prevent lines across
               vertical asymptotes.
            */

            if (
                previousY !== null &&
                Math.abs(y - previousY) > 3
            ) {

                started = false;

            }


            if (!started) {

                ctx.moveTo(
                    px,
                    py
                );

                started = true;

            } else {

                ctx.lineTo(
                    px,
                    py
                );

            }


            previousY = y;

        }


        ctx.stroke();

    }


    /*
       Left side.
    */

    drawFunction(
        functions.left,
        2.3
    );


    /*
       Right side in a slightly different
       visual treatment.
    */

    ctx.save();

    ctx.setLineDash([8, 5]);

    ctx.strokeStyle =
        "#9bc5ff";


    const samples = 7000;

    ctx.beginPath();

    let started = false;

    let previousY = null;


    for (
        let i = 0;
        i <= samples;
        i++
    ) {

        const x =
            xmin +
            (i / samples) *
            (xmax - xmin);


        const y =
            functions.right(x);


        if (
            !Number.isFinite(y) ||
            Math.abs(y) > 100
        ) {

            started = false;

            previousY = null;

            continue;

        }


        if (
            previousY !== null &&
            Math.abs(y - previousY) > 3
        ) {

            started = false;

        }


        const px =
            xToPixel(x);


        const py =
            yToPixel(y);


        if (!started) {

            ctx.moveTo(
                px,
                py
            );

            started = true;

        } else {

            ctx.lineTo(
                px,
                py
            );

        }


        previousY = y;

    }


    ctx.stroke();

    ctx.restore();


    /*
       X labels — larger now.
    */

    ctx.fillStyle =
        "#9bc5ff";

    ctx.font =
        "18px 'DM Mono', monospace";

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "top";


    for (
        let multiple = Math.ceil(xmin / PI);
        multiple <= Math.floor(xmax / PI);
        multiple++
    ) {

        const x =
            multiple * PI;


        const px =
            xToPixel(x);


        let label;


        if (multiple === 0) {

            label = "0";

        } else if (multiple === 1) {

            label = "π";

        } else if (multiple === -1) {

            label = "-π";

        } else {

            label =
                `${multiple}π`;

        }


        const axisY =
            yToPixel(0);


        ctx.fillText(
            label,
            px,
            axisY + 13
        );

    }


    /*
       Y labels.
    */

    ctx.textAlign =
        "right";

    ctx.textBaseline =
        "middle";


    for (
        let y = -5;
        y <= 5;
        y++
    ) {

        if (y === 0) continue;


        ctx.fillText(
            String(y),
            px0 - 10,
            yToPixel(y)
        );

    }


    /*
       Intersection points.
    */

    roots.forEach(
        (root, index) => {

            /*
               Also show the same intersection
               shifted into the wider graph.
            */

            const candidates = [
                root,
                root - period,
                root + period,
                root - 2 * period,
                root + 2 * period
            ];


            candidates.forEach(
                x => {

                    if (
                        x < xmin ||
                        x > xmax
                    ) {

                        return;

                    }


                    const y =
                        functions.left(x);


                    if (
                        !Number.isFinite(y) ||
                        Math.abs(y) > 100
                    ) {

                        return;

                    }


                    const px =
                        xToPixel(x);


                    const py =
                        yToPixel(y);


                    ctx.beginPath();

                    ctx.arc(
                        px,
                        py,
                        7,
                        0,
                        TWO_PI
                    );

                    ctx.fillStyle =
                        "rgba(237,244,255,0.16)";

                    ctx.fill();


                    ctx.beginPath();

                    ctx.arc(
                        px,
                        py,
                        4,
                        0,
                        TWO_PI
                    );

                    ctx.fillStyle =
                        "#edf4ff";

                    ctx.fill();


                    ctx.fillStyle =
                        "#edf4ff";

                    ctx.font =
                        "14px 'DM Mono', monospace";

                    ctx.textAlign =
                        "left";

                    ctx.textBaseline =
                        "bottom";


                    ctx.fillText(
                        String(index + 1),
                        px + 9,
                        py - 9
                    );

                }
            );

        }
    );

}


/* =========================================================
   INTERSECTION LIST
   ========================================================= */

function displayIntersections(
    functions,
    roots,
    period
) {

    intersectionList.innerHTML = "";


    if (roots.length === 0) {

        intersectionList.textContent =
            "No real intersection was found in one period.";

        return;

    }


    roots.forEach(
        (root, index) => {

            const y =
                functions.left(root);


            const xLatex =
                angleToLatex(
                    root,
                    period
                );


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "intersection-item";


            div.innerHTML =
                `
                P_{${index + 1}}
                =
                ${renderMath(
                    `(${xLatex},${formatDecimal(y)})`
                )}
                `;


            intersectionList.appendChild(
                div
            );

        }
    );

}


/* =========================================================
   GENERAL SOLUTION
   ========================================================= */

function displayGeneralSolution(
    roots,
    period
) {

    periodSolutions.innerHTML = "";

    generalSolutions.innerHTML = "";


    if (roots.length === 0) {

        periodSolutions.innerHTML =
            renderMath(
                "\\text{No real solution}"
            );


        generalSolutions.innerHTML =
            renderMath(
                "\\text{No real solution}"
            );


        return;

    }


    /*
       ONE PERIOD
    */

    roots.forEach(
        (root, index) => {

            const angle =
                angleToLatex(
                    root,
                    period
                );


            const latex =
                `x_{${index + 1}}=${angle}`;


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "solution-item";


            div.innerHTML =
                renderMath(
                    latex
                );


            periodSolutions.appendChild(
                div
            );

        }
    );


    /*
       GENERAL SOLUTION

       π-periodic:
       x = α + kπ

       2π-periodic:
       x = α + 2πk

       k ∈ Z
    */

    roots.forEach(
        (root, index) => {

            const alpha =
                angleToLatex(
                    root,
                    period
                );


            let solution;


            /*
               α = 0
            */

            if (alpha === "0") {

                if (period === PI) {

                    solution =
                        "x=k\\pi";

                } else {

                    solution =
                        "x=2\\pi k";

                }

            }

            /*
               α ≠ 0
            */

            else {

                if (period === PI) {

                    solution =
                        `x=${alpha}+k\\pi`;

                } else {

                    solution =
                        `x=${alpha}+2\\pi k`;

                }

            }


            /*
               Add the integer condition explicitly.
            */

            solution +=
                ",\\qquad k\\in\\mathbb{Z}";


            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "solution-item";


            div.innerHTML =
                renderMath(
                    solution
                );


            generalSolutions.appendChild(
                div
            );

        }
    );

}


/* =========================================================
   MAIN ANALYZER
   ========================================================= */

function analyzeEquation() {

    errorMessage.textContent = "";


    try {

        /*
           1. Read equation.
        */

        const equation =
            parseEquation();


        /*
           2. Compile both sides.
        */

        const functions =
            makeDifference(
                equation
            );


        /*
           3. Determine period.
        */

        const period =
            equation.period;


        /*
           Update UI.
        */

        periodRange.innerHTML =
            period === PI
                ? "0 ≤ x &lt; π"
                : "0 ≤ x &lt; 2π";


        /*
           4. Find roots.
        */

        let roots =
            findRoots(
                functions.difference,
                0,
                period,
                30000
            );


        /*
           5. Snap familiar numerical
              values to exact π forms.
        */

        roots =
            snapRootsToExact(
                roots
            );


        /*
           6. Sort.
        */

        roots.sort(
            (a, b) => a - b
        );


        /*
           7. Display.
        */

        drawUnitCircle(
            roots,
            period
        );


        displayCircleSolutions(
            roots,
            period
        );


        drawGraph(
            equation,
            functions,
            roots,
            period
        );


        displayIntersections(
            functions,
            roots,
            period
        );


        displayGeneralSolution(
            roots,
            period
        );


    } catch (error) {

        console.error(error);


        errorMessage.textContent =
            error.message ||
            "Unable to solve the equation.";


        solutionCount.textContent =
            "—";


        circleSolutions.textContent =
            "Unable to calculate.";


        intersectionList.textContent =
            "Unable to calculate.";


        periodSolutions.innerHTML =
            "—";


        generalSolutions.innerHTML =
            "—";


        drawUnitCircle(
            [],
            TWO_PI
        );

    }

}


/* =========================================================
   BUTTON
   ========================================================= */

analyzeBtn.addEventListener(
    "click",
    analyzeEquation
);


/* =========================================================
   ENTER KEY
   ========================================================= */

equationInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            analyzeEquation();

        }

    }
);


/* =========================================================
   INITIAL STATE
   ========================================================= */

drawUnitCircle(
    [],
    TWO_PI
);