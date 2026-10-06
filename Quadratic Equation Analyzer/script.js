const functionInput =
    document.getElementById("functionInput");

const analyzeBtn =
    document.getElementById("analyzeBtn");

const errorMessage =
    document.getElementById("errorMessage");


// ======================================================
// BASIC
// ======================================================

function showError(message) {

    errorMessage.textContent = message;

    errorMessage.style.display = "block";
}


function hideError() {

    errorMessage.textContent = "";

    errorMessage.style.display = "none";
}


// ======================================================
// NORMALIZE INPUT
// ======================================================

function normalizeInput(input) {

    return input
        .replace(/\s/g, "")
        .replace(/−/g, "-")
        .replace(/²/g, "^2")
        .replace(/³/g, "^3")
        .replace(/\*/g, "")
        .replace(/^f\(x\)=/i, "")
        .replace(/^y=/i, "");
}


// ======================================================
// NUMBER FORMAT
// ======================================================

function numLatex(number) {

    if (Math.abs(number) < 0.000000001) {
        return "0";
    }

    if (Number.isInteger(number)) {
        return number.toString();
    }

    return number
        .toFixed(8)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}


// ======================================================
// GCD
// ======================================================

function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

        const temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}


// ======================================================
// FRACTION
// ======================================================

function fractionLatex(numerator, denominator) {

    if (
        !Number.isFinite(numerator) ||
        !Number.isFinite(denominator) ||
        denominator === 0
    ) {

        return "\\text{undefined}";
    }


    if (
        Number.isInteger(numerator) &&
        Number.isInteger(denominator)
    ) {

        let divisor =
            gcd(numerator, denominator);

        numerator /= divisor;

        denominator /= divisor;


        if (denominator < 0) {

            numerator *= -1;

            denominator *= -1;
        }


        if (denominator === 1) {

            return numLatex(numerator);
        }


        return `
            \\frac{
                ${numLatex(numerator)}
            }{
                ${numLatex(denominator)}
            }
        `;
    }


    return `
        \\frac{
            ${numLatex(numerator)}
        }{
            ${numLatex(denominator)}
        }
    `;
}


// ======================================================
// QUADRATIC PARSER
// ======================================================

function parseQuadratic(input) {

    let expression =
        normalizeInput(input);


    if (!expression) {

        throw new Error(
            "An expression cannot be empty."
        );
    }


    // Remove outer parentheses if the
    // whole expression is enclosed.

    while (
        expression.startsWith("(") &&
        expression.endsWith(")")
    ) {

        let depth = 0;
        let enclosed = true;

        for (
            let i = 0;
            i < expression.length;
            i++
        ) {

            if (expression[i] === "(") {
                depth++;
            }

            if (expression[i] === ")") {
                depth--;
            }

            if (
                depth === 0 &&
                i < expression.length - 1
            ) {
                enclosed = false;
                break;
            }
        }

        if (enclosed) {

            expression =
                expression.slice(1, -1);

        } else {

            break;
        }
    }


    // Reject higher powers.

    if (
        /x\^(?:[3-9]|\d{2,})/i.test(expression) ||
        /x³/i.test(expression)
    ) {

        throw new Error(
            "Please enter a quadratic function. The highest power of x must be 2."
        );
    }


    // Convert x2 to x^2.

    expression =
        expression.replace(
            /x2/gi,
            "x^2"
        );


    // A quadratic polynomial should
    // consist of three possible terms:
    // ax² + bx + c

    const termPattern =
        /[+-]?[^+-]+/g;

    const terms =
        expression.match(termPattern);


    if (!terms) {

        throw new Error(
            "Invalid quadratic function."
        );
    }


    let a = 0;
    let b = 0;
    let c = 0;


    for (let term of terms) {

        if (!term) {
            continue;
        }


        // x² term

        if (
            /x\^2/i.test(term)
        ) {

            const coefficient =
                term.replace(
                    /x\^2/gi,
                    ""
                );


            if (
                coefficient === "" ||
                coefficient === "+"
            ) {

                a += 1;

            } else if (
                coefficient === "-"
            ) {

                a -= 1;

            } else {

                const value =
                    Number(coefficient);

                if (!Number.isFinite(value)) {

                    throw new Error(
                        "Invalid coefficient of x²."
                    );
                }

                a += value;
            }


            continue;
        }


        // x term

        if (
            /x/i.test(term)
        ) {

            const coefficient =
                term.replace(
                    /x/gi,
                    ""
                );


            if (
                coefficient === "" ||
                coefficient === "+"
            ) {

                b += 1;

            } else if (
                coefficient === "-"
            ) {

                b -= 1;

            } else {

                const value =
                    Number(coefficient);

                if (!Number.isFinite(value)) {

                    throw new Error(
                        "Invalid coefficient of x."
                    );
                }

                b += value;
            }


            continue;
        }


        // Constant

        const constant =
            Number(term);


        if (!Number.isFinite(constant)) {

            throw new Error(
                "Invalid constant term."
            );
        }


        c += constant;
    }


    if (a === 0) {

        throw new Error(
            "This is not a quadratic function. The coefficient of x² must be non-zero."
        );
    }


    return {
        a,
        b,
        c
    };
}


// ======================================================
// FUNCTION LATEX
// ======================================================

function quadraticLatex(a, b, c) {

    let result = "";


    // ax²

    if (a === 1) {

        result += "x^2";

    } else if (a === -1) {

        result += "-x^2";

    } else {

        result +=
            numLatex(a) + "x^2";
    }


    // bx

    if (b !== 0) {

        if (b > 0) {

            if (b === 1) {

                result += "+x";

            } else {

                result +=
                    "+" + numLatex(b) + "x";
            }

        } else {

            if (b === -1) {

                result += "-x";

            } else {

                result +=
                    numLatex(b) + "x";
            }
        }
    }


    // c

    if (c !== 0) {

        if (c > 0) {

            result +=
                "+" + numLatex(c);

        } else {

            result +=
                numLatex(c);
        }
    }


    return result;
}


// ======================================================
// ROOT LATEX
// ======================================================

function rootLatex(a, b, delta, sign) {

    /*
        x = (-b ± √Δ) / 2a
    */


    if (delta === 0) {

        return fractionLatex(
            -b,
            2 * a
        );
    }


    // Perfect square positive delta

    if (
        delta > 0 &&
        Number.isInteger(delta)
    ) {

        const sqrtDelta =
            Math.sqrt(delta);


        if (
            Number.isInteger(sqrtDelta)
        ) {

            const numerator =
                -b + sign * sqrtDelta;

            return fractionLatex(
                numerator,
                2 * a
            );
        }
    }


    // General exact form

    let numerator;


    if (sign === 1) {

        numerator =
            `${numLatex(-b)}+\\sqrt{${numLatex(delta)}}`;

    } else {

        numerator =
            `${numLatex(-b)}-\\sqrt{${numLatex(delta)}}`;
    }


    return `
        \\frac{
            ${numerator}
        }{
            ${numLatex(2 * a)}
        }
    `;
}


// ======================================================
// VERTEX VALUES
// ======================================================

function calculateVertex(a, b, c) {

    const x =
        -b / (2 * a);

    const y =
        a * x * x +
        b * x +
        c;


    return {
        x,
        y
    };
}


// ======================================================
// ANALYZE
// ======================================================

function analyzeFunction() {

    hideError();


    const input =
        functionInput.value.trim();


    if (!input) {

        showError(
            "Please enter a function."
        );

        return;
    }


    let data;


    try {

        data =
            parseQuadratic(input);

    } catch (error) {

        showError(error.message);

        return;
    }


    const {
        a,
        b,
        c
    } = data;


    // ==================================================
    // FUNCTION
    // ==================================================

    document.getElementById(
        "functionDisplay"
    ).innerHTML =
        `$$f(x)=${quadraticLatex(a,b,c)}$$`;


    // ==================================================
    // COEFFICIENTS
    // ==================================================

    document.getElementById(
        "aValue"
    ).textContent = numLatex(a);

    document.getElementById(
        "bValue"
    ).textContent = numLatex(b);

    document.getElementById(
        "cValue"
    ).textContent = numLatex(c);


    // ==================================================
    // DISCRIMINANT
    // ==================================================

    const delta =
        b * b - 4 * a * c;


    document.getElementById(
        "deltaFormula"
    ).innerHTML =
        `$$\\Delta=b^2-4ac=${numLatex(delta)}$$`;


    document.getElementById(
        "deltaValue"
    ).textContent =
        numLatex(delta);


    // ==================================================
    // ROOTS
    // ==================================================

    const rootsFormula =
        document.getElementById(
            "rootsFormula"
        );

    const rootsResult =
        document.getElementById(
            "rootsResult"
        );


    if (delta > 0) {

        rootsFormula.innerHTML =
            `$$x_{1,2}=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}$$`;

        rootsResult.innerHTML =
            `
            <span>
                2 Real Roots
            </span>
            `;

    } else if (delta === 0) {

        rootsFormula.innerHTML =
            `$$x_1=x_2=\\frac{-b}{2a}$$`;

        rootsResult.innerHTML =
            `
            <span>
                1 Repeated Root
            </span>
            `;

    } else {

        rootsFormula.innerHTML =
            `$$x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}$$`;

        rootsResult.innerHTML =
            `
            <span>
                No Real Roots
            </span>
            `;
    }


    // ==================================================
    // VERTEX
    // ==================================================

    const vertex =
        calculateVertex(
            a,
            b,
            c
        );


    document.getElementById(
        "vertexFormula"
    ).innerHTML =
        `
        $$x_v=\\frac{-b}{2a},
        \\qquad y_v=f(x_v)$$
        `;


    document.getElementById(
        "vertexX"
    ).textContent =
        formatNumber(vertex.x);


    document.getElementById(
        "vertexY"
    ).textContent =
        formatNumber(vertex.y);


    document.getElementById(
        "vertexPoint"
    ).textContent =
        `(${formatNumber(vertex.x)}, ${formatNumber(vertex.y)})`;


    // ==================================================
    // PARABOLA DIRECTION
    // ==================================================

    const parabolaIcon =
        document.getElementById(
            "parabolaIcon"
        );

    const directionText =
        document.getElementById(
            "directionText"
        );

    const extremeText =
        document.getElementById(
            "extremeText"
        );


    if (a > 0) {

        parabolaIcon.textContent =
            "∪";

        directionText.textContent =
            "Opens Upward";

        extremeText.textContent =
            "The vertex is a minimum point.";

    } else {

        parabolaIcon.textContent =
            "∩";

        directionText.textContent =
            "Opens Downward";

        extremeText.textContent =
            "The vertex is a maximum point.";
    }


    // ==================================================
    // ANALYSIS TEXT
    // ==================================================

    let rootDescription;


    if (delta > 0) {

        rootDescription =
            "two distinct real roots";

    } else if (delta === 0) {

        rootDescription =
            "one repeated real root";

    } else {

        rootDescription =
            "no real roots";
    }


    const extreme =
        a > 0
            ? "minimum"
            : "maximum";


    document.getElementById(
        "analysisText"
    ).innerHTML =
        `
        Since
        <strong>Δ = b² − 4ac = ${numLatex(delta)}</strong>,
        this quadratic has
        <strong>${rootDescription}</strong>.

        The vertex is
        <strong>(${formatNumber(vertex.x)},
        ${formatNumber(vertex.y)})</strong>,

        and because
        <strong>a = ${numLatex(a)}</strong>,
        the parabola opens
        <strong>${a > 0 ? "upward" : "downward"}</strong>.

        Therefore, the vertex represents the
        <strong>${extreme}</strong>
        value of the function.
        `;


    // ==================================================
    // SHOW RESULTS
    // ==================================================

    document.getElementById(
        "results"
    ).classList.remove("hidden");


    // ==================================================
    // DRAW GRAPH
    // ==================================================

    drawGraph(
        a,
        b,
        c,
        delta,
        vertex
    );


    // ==================================================
    // MATHJAX
    // ==================================================

    if (
        window.MathJax &&
        MathJax.typesetPromise
    ) {

        MathJax.typesetPromise();
    }
}


// ======================================================
// GRAPH
// ======================================================

function drawGraph(
    a,
    b,
    c,
    delta,
    vertex
) {

    const canvas =
        document.getElementById(
            "graphCanvas"
        );


    const container =
        canvas.parentElement;


    const width =
        container.clientWidth;

    const height =
        container.clientHeight;


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";


    const ctx =
        canvas.getContext("2d");


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    // ==================================================
    // GRAPH SETTINGS
    // ==================================================

    const left = 45;
    const right = width - 20;

    const top = 20;
    const bottom = height - 35;

    const graphWidth =
        right - left;

    const graphHeight =
        bottom - top;


    // ==================================================
    // VIEW RANGE
    // ==================================================

    let xRange = 6;


    // Keep the vertex visible.

    if (
        Math.abs(vertex.x) > 4
    ) {

        xRange =
            Math.abs(vertex.x) + 4;
    }


    // Include roots in the view.

    if (delta >= 0) {

        const sqrtDelta =
            Math.sqrt(delta);

        const x1 =
            (-b - sqrtDelta) /
            (2 * a);

        const x2 =
            (-b + sqrtDelta) /
            (2 * a);


        const largestRoot =
            Math.max(
                Math.abs(x1),
                Math.abs(x2)
            );


        if (
            largestRoot + 2 > xRange
        ) {

            xRange =
                largestRoot + 2;
        }
    }


    xRange =
        Math.min(
            Math.max(xRange, 6),
            30
        );


    // ==================================================
    // Y RANGE
    // ==================================================

    let yValues = [];


    for (
        let i = 0;
        i <= 200;
        i++
    ) {

        const x =
            -xRange +
            (2 * xRange * i / 200);


        const y =
            a * x * x +
            b * x +
            c;


        if (
            Number.isFinite(y)
        ) {

            yValues.push(y);
        }
    }


    yValues.push(vertex.y);
    yValues.push(0);


    let minY =
        Math.min(...yValues);

    let maxY =
        Math.max(...yValues);


    if (
        minY === maxY
    ) {

        minY -= 1;
        maxY += 1;
    }


    let yRange =
        Math.max(
            Math.abs(minY),
            Math.abs(maxY)
        );


    yRange *= 1.15;


    yRange =
        Math.min(
            Math.max(yRange, 4),
            50
        );


    // ==================================================
    // SCALE
    // ==================================================

    function sx(x) {

        return left +
            (
                (x + xRange) /
                (2 * xRange)
            ) *
            graphWidth;
    }


    function sy(y) {

        return bottom -
            (
                (y + yRange) /
                (2 * yRange)
            ) *
            graphHeight;
    }


    // ==================================================
    // BACKGROUND
    // ==================================================

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // ==================================================
    // GRID
    // ==================================================

    ctx.lineWidth = 1;

    ctx.strokeStyle =
        "rgba(148,163,184,0.08)";


    for (
        let x = Math.ceil(-xRange);
        x <= xRange;
        x++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx(x),
            top
        );

        ctx.lineTo(
            sx(x),
            bottom
        );

        ctx.stroke();
    }


    for (
        let y = Math.ceil(-yRange);
        y <= yRange;
        y++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left,
            sy(y)
        );

        ctx.lineTo(
            right,
            sy(y)
        );

        ctx.stroke();
    }


    // ==================================================
    // AXES
    // ==================================================

    ctx.strokeStyle =
        "rgba(148,163,184,0.35)";

    ctx.lineWidth = 1.3;


    if (
        -xRange <= 0 &&
        0 <= xRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx(0),
            top
        );

        ctx.lineTo(
            sx(0),
            bottom
        );

        ctx.stroke();
    }


    if (
        -yRange <= 0 &&
        0 <= yRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left,
            sy(0)
        );

        ctx.lineTo(
            right,
            sy(0)
        );

        ctx.stroke();
    }


    // ==================================================
    // PARABOLA
    // ==================================================

    ctx.strokeStyle =
        "#60a5fa";

    ctx.lineWidth = 2.8;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";


    ctx.beginPath();


    let started = false;


    const steps = 1200;


    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const x =
            -xRange +
            (
                2 * xRange *
                i /
                steps
            );


        const y =
            a * x * x +
            b * x +
            c;


        if (
            !Number.isFinite(y) ||
            y < -yRange * 2 ||
            y > yRange * 2
        ) {

            started = false;

            continue;
        }


        const px =
            sx(x);

        const py =
            sy(y);


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
    }


    ctx.stroke();


    // ==================================================
    // ROOTS
    // ==================================================

    if (delta >= 0) {

        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            (-b - sqrtDelta) /
            (2 * a);

        const x2 =
            (-b + sqrtDelta) /
            (2 * a);


        drawPoint(
            x1,
            0,
            "#93c5fd"
        );


        if (
            Math.abs(x2 - x1) > 0.000001
        ) {

            drawPoint(
                x2,
                0,
                "#93c5fd"
            );
        }
    }


    // ==================================================
    // VERTEX
    // ==================================================

    drawPoint(
        vertex.x,
        vertex.y,
        "#facc15"
    );


    // ==================================================
    // LABELS
    // ==================================================

    ctx.font =
        "12px Segoe UI";


    ctx.fillStyle =
        "rgba(250,204,21,0.95)";


    if (
        vertex.x >= -xRange &&
        vertex.x <= xRange &&
        vertex.y >= -yRange &&
        vertex.y <= yRange
    ) {

        ctx.fillText(
            "V (" +
            formatNumber(vertex.x) +
            ", " +
            formatNumber(vertex.y) +
            ")",
            sx(vertex.x) + 8,
            sy(vertex.y) - 9
        );
    }


    // Root labels

    if (delta >= 0) {

        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            (-b - sqrtDelta) /
            (2 * a);

        const x2 =
            (-b + sqrtDelta) /
            (2 * a);


        ctx.fillStyle =
            "rgba(147,197,253,0.9)";


        if (
            x1 >= -xRange &&
            x1 <= xRange
        ) {

            ctx.fillText(
                "x₁ = " +
                formatNumber(x1),
                sx(x1) + 6,
                sy(0) - 9
            );
        }


        if (
            Math.abs(x2 - x1) > 0.000001 &&
            x2 >= -xRange &&
            x2 <= xRange
        ) {

            ctx.fillText(
                "x₂ = " +
                formatNumber(x2),
                sx(x2) + 6,
                sy(0) - 9
            );
        }
    }


    // ==================================================
    // AXIS LABELS
    // ==================================================

    ctx.fillStyle =
        "rgba(203,213,225,0.55)";


    ctx.fillText(
        "x",
        right - 10,
        sy(0) - 7
    );


    ctx.fillText(
        "y",
        sx(0) + 7,
        top + 12
    );
}


// ======================================================
// GRAPH POINT
// ======================================================

function drawPoint(
    x,
    y,
    color
) {

    const canvas =
        document.getElementById(
            "graphCanvas"
        );

    const container =
        canvas.parentElement;


    const width =
        container.clientWidth;

    const height =
        container.clientHeight;


    const left = 45;
    const right = width - 20;

    const top = 20;
    const bottom = height - 35;


    // Recalculate ranges using the same
    // basic graph settings.

    let xRange = 6;


    const vertexX =
        x;


    if (
        Math.abs(vertexX) > 4
    ) {

        xRange =
            Math.abs(vertexX) + 4;
    }


    xRange =
        Math.min(
            Math.max(xRange, 6),
            30
        );


    // This function is only used for
    // visual points, so derive y-range
    // from the current quadratic.

    // Instead of trying to reconstruct
    // the graph scaling here, the point
    // is drawn by the dedicated point
    // routine below.

    // This function intentionally does
    // nothing if called independently.
    // The actual points are drawn in
    // drawGraphPoint().

    drawGraphPoint(
        x,
        y,
        color
    );
}


// ======================================================
// DRAW GRAPH POINT WITH CURRENT SCALE
// ======================================================

let currentGraphScale = null;


function drawGraphPoint(
    x,
    y,
    color
) {

    if (!currentGraphScale) {
        return;
    }


    const {
        ctx,
        sx,
        sy
    } = currentGraphScale;


    const px =
        sx(x);

    const py =
        sy(y);


    ctx.beginPath();

    ctx.arc(
        px,
        py,
        4.5,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        color;

    ctx.fill();


    ctx.lineWidth = 1.5;

    ctx.strokeStyle =
        "rgba(7,17,31,0.9)";

    ctx.stroke();
}


// ======================================================
// PATCH GRAPH SCALE
// ======================================================

const originalDrawGraph =
    drawGraph;


// Replace graph point handling with
// the correct current coordinate system.

drawGraph = function(
    a,
    b,
    c,
    delta,
    vertex
) {

    const canvas =
        document.getElementById(
            "graphCanvas"
        );

    const container =
        canvas.parentElement;


    const width =
        container.clientWidth;

    const height =
        container.clientHeight;


    const dpr =
        window.devicePixelRatio || 1;


    canvas.width =
        width * dpr;

    canvas.height =
        height * dpr;


    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";


    const ctx =
        canvas.getContext("2d");


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const left = 45;
    const right = width - 20;

    const top = 20;
    const bottom = height - 35;

    const graphWidth =
        right - left;

    const graphHeight =
        bottom - top;


    // ==================================================
    // X RANGE
    // ==================================================

    let xRange = 6;


    if (
        Math.abs(vertex.x) > 4
    ) {

        xRange =
            Math.abs(vertex.x) + 4;
    }


    if (delta >= 0) {

        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            (-b - sqrtDelta) /
            (2 * a);

        const x2 =
            (-b + sqrtDelta) /
            (2 * a);


        const largestRoot =
            Math.max(
                Math.abs(x1),
                Math.abs(x2)
            );


        if (
            largestRoot + 2 > xRange
        ) {

            xRange =
                largestRoot + 2;
        }
    }


    xRange =
        Math.min(
            Math.max(xRange, 6),
            30
        );


    // ==================================================
    // Y RANGE
    // ==================================================

    let minY = Infinity;
    let maxY = -Infinity;


    for (
        let i = 0;
        i <= 300;
        i++
    ) {

        const x =
            -xRange +
            (
                2 * xRange *
                i /
                300
            );


        const y =
            a * x * x +
            b * x +
            c;


        if (
            Number.isFinite(y)
        ) {

            minY =
                Math.min(minY, y);

            maxY =
                Math.max(maxY, y);
        }
    }


    minY =
        Math.min(
            minY,
            vertex.y,
            0
        );

    maxY =
        Math.max(
            maxY,
            vertex.y,
            0
        );


    if (
        minY === maxY
    ) {

        minY -= 1;
        maxY += 1;
    }


    let yRange =
        Math.max(
            Math.abs(minY),
            Math.abs(maxY)
        ) * 1.15;


    yRange =
        Math.min(
            Math.max(yRange, 4),
            50
        );


    function sx(x) {

        return left +
            (
                (x + xRange) /
                (2 * xRange)
            ) *
            graphWidth;
    }


    function sy(y) {

        return bottom -
            (
                (y + yRange) /
                (2 * yRange)
            ) *
            graphHeight;
    }


    currentGraphScale = {
        ctx,
        sx,
        sy
    };


    // ==================================================
    // CLEAR
    // ==================================================

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // ==================================================
    // GRID
    // ==================================================

    ctx.lineWidth = 1;

    ctx.strokeStyle =
        "rgba(148,163,184,0.08)";


    for (
        let x = Math.ceil(-xRange);
        x <= xRange;
        x++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx(x),
            top
        );

        ctx.lineTo(
            sx(x),
            bottom
        );

        ctx.stroke();
    }


    for (
        let y = Math.ceil(-yRange);
        y <= yRange;
        y++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left,
            sy(y)
        );

        ctx.lineTo(
            right,
            sy(y)
        );

        ctx.stroke();
    }


    // ==================================================
    // AXES
    // ==================================================

    ctx.strokeStyle =
        "rgba(148,163,184,0.35)";

    ctx.lineWidth = 1.3;


    if (
        -xRange <= 0 &&
        0 <= xRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx(0),
            top
        );

        ctx.lineTo(
            sx(0),
            bottom
        );

        ctx.stroke();
    }


    if (
        -yRange <= 0 &&
        0 <= yRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left,
            sy(0)
        );

        ctx.lineTo(
            right,
            sy(0)
        );

        ctx.stroke();
    }


    // ==================================================
    // PARABOLA
    // ==================================================

    ctx.strokeStyle =
        "#60a5fa";

    ctx.lineWidth = 2.8;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";


    ctx.beginPath();


    let started = false;


    const steps = 1200;


    for (
        let i = 0;
        i <= steps;
        i++
    ) {

        const x =
            -xRange +
            (
                2 * xRange *
                i /
                steps
            );


        const y =
            a * x * x +
            b * x +
            c;


        if (
            !Number.isFinite(y) ||
            y < -yRange * 2 ||
            y > yRange * 2
        ) {

            started = false;

            continue;
        }


        const px =
            sx(x);

        const py =
            sy(y);


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
    }


    ctx.stroke();


    // ==================================================
    // ROOTS
    // ==================================================

    let roots = [];


    if (delta >= 0) {

        const sqrtDelta =
            Math.sqrt(delta);


        const x1 =
            (-b - sqrtDelta) /
            (2 * a);

        const x2 =
            (-b + sqrtDelta) /
            (2 * a);


        roots.push(x1);


        if (
            Math.abs(x2 - x1) > 0.000001
        ) {

            roots.push(x2);
        }
    }


    // Root points

    roots.forEach(root => {

        if (
            root >= -xRange &&
            root <= xRange
        ) {

            drawGraphPoint(
                root,
                0,
                "#93c5fd"
            );
        }
    });


    // ==================================================
    // VERTEX POINT
    // ==================================================

    if (
        vertex.x >= -xRange &&
        vertex.x <= xRange &&
        vertex.y >= -yRange &&
        vertex.y <= yRange
    ) {

        drawGraphPoint(
            vertex.x,
            vertex.y,
            "#facc15"
        );
    }


    // ==================================================
    // LABELS
    // ==================================================

    ctx.font =
        "12px Segoe UI";


    // Vertex label

    if (
        vertex.x >= -xRange &&
        vertex.x <= xRange &&
        vertex.y >= -yRange &&
        vertex.y <= yRange
    ) {

        ctx.fillStyle =
            "rgba(250,204,21,0.95)";


        ctx.fillText(
            "V (" +
            formatNumber(vertex.x) +
            ", " +
            formatNumber(vertex.y) +
            ")",
            sx(vertex.x) + 8,
            sy(vertex.y) - 9
        );
    }


    // Root labels

    ctx.fillStyle =
        "rgba(147,197,253,0.9)";


    roots.forEach(
        (root, index) => {

            if (
                root >= -xRange &&
                root <= xRange
            ) {

                ctx.fillText(
                    "x" +
                    (index + 1) +
                    " = " +
                    formatNumber(root),
                    sx(root) + 6,
                    sy(0) - 9
                );
            }
        }
    );


    // ==================================================
    // AXIS LABELS
    // ==================================================

    ctx.fillStyle =
        "rgba(203,213,225,0.55)";


    ctx.fillText(
        "x",
        right - 10,
        sy(0) - 7
    );


    ctx.fillText(
        "y",
        sx(0) + 7,
        top + 12
    );
};


// ======================================================
// FORMAT NUMBER FOR GRAPH
// ======================================================

function formatNumber(number) {

    if (
        Math.abs(number) < 0.000001
    ) {

        return "0";
    }


    if (
        Number.isInteger(number)
    ) {

        return number.toString();
    }


    return number
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}


// ======================================================
// BUTTON
// ======================================================

analyzeBtn.addEventListener(
    "click",
    analyzeFunction
);


// ======================================================
// ENTER
// ======================================================

functionInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            analyzeFunction();
        }
    }
);


// ======================================================
// EXAMPLES
// ======================================================

document
    .querySelectorAll(".example-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                functionInput.value =
                    button.dataset.function;

                analyzeFunction();
            }
        );
    });


// ======================================================
// REDRAW GRAPH ON RESIZE
// ======================================================

window.addEventListener(
    "resize",
    () => {

        const results =
            document.getElementById(
                "results"
            );


        if (
            results.classList.contains(
                "hidden"
            )
        ) {

            return;
        }


        const input =
            functionInput.value.trim();


        if (!input) {
            return;
        }


        try {

            const {
                a,
                b,
                c
            } =
                parseQuadratic(input);


            const delta =
                b * b -
                4 * a * c;


            const vertex =
                calculateVertex(
                    a,
                    b,
                    c
                );


            drawGraph(
                a,
                b,
                c,
                delta,
                vertex
            );

        } catch {

            // Do nothing
        }
    }
);
