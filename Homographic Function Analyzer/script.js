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
// PARSE LINEAR EXPRESSION
// ======================================================

function parseLinear(expression) {

    expression = expression
        .replace(/\s/g, "")
        .replace(/\*/g, "")
        .replace(/−/g, "-");


    if (!expression) {

        throw new Error(
            "An expression cannot be empty."
        );
    }


    const xCount =
        (expression.match(/x/gi) || []).length;


    if (xCount > 1) {

        throw new Error(
            "The numerator and denominator must be linear."
        );
    }


    // Constant

    if (xCount === 0) {

        const b = Number(expression);

        if (!Number.isFinite(b)) {

            throw new Error(
                "Invalid linear expression."
            );
        }

        return {
            a: 0,
            b: b
        };
    }


    const match =
        expression.match(
            /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)?)[xX]([+-]?(?:\d+(?:\.\d*)?|\.\d+))?$/
        );


    if (!match) {

        throw new Error(
            "Please enter a linear expression such as 2x+3 or x-4."
        );
    }


    let aText = match[1];

    let bText = match[2];


    let a;


    if (
        aText === "" ||
        aText === "+"
    ) {

        a = 1;

    } else if (aText === "-") {

        a = -1;

    } else {

        a = Number(aText);
    }


    const b =
        bText === undefined
            ? 0
            : Number(bText);


    return {
        a: a,
        b: b
    };
}


// ======================================================
// SPLIT FRACTION
// ======================================================

function splitFraction(input) {

    input = input
        .replace(/\s/g, "")
        .replace(/−/g, "-");


    input =
        input.replace(/^f\(x\)=/i, "");

    input =
        input.replace(/^y=/i, "");


    const standard =
        input.match(
            /^\((.*)\)\/\((.*)\)$/
        );


    if (standard) {

        return {

            numerator: standard[1],

            denominator: standard[2]
        };
    }


    const slash =
        input.indexOf("/");


    if (slash === -1) {

        throw new Error(
            "Please use / between the numerator and denominator."
        );
    }


    let numerator =
        input.substring(0, slash);

    let denominator =
        input.substring(slash + 1);


    if (
        numerator.startsWith("(") &&
        numerator.endsWith(")")
    ) {

        numerator =
            numerator.slice(1, -1);
    }


    if (
        denominator.startsWith("(") &&
        denominator.endsWith(")")
    ) {

        denominator =
            denominator.slice(1, -1);
    }


    return {
        numerator,
        denominator
    };
}


// ======================================================
// PARSE HOMOGRAPHIC FUNCTION
// ======================================================

function parseHomographic(input) {

    const parts =
        splitFraction(input);


    const numerator =
        parseLinear(parts.numerator);


    const denominator =
        parseLinear(parts.denominator);


    return {

        a: numerator.a,

        b: numerator.b,

        c: denominator.a,

        d: denominator.b
    };
}


// ======================================================
// LATEX
// ======================================================

function numLatex(n) {

    if (Number.isInteger(n)) {

        return n.toString();
    }


    return n
        .toFixed(6)
        .replace(/0+$/, "")
        .replace(/\.$/, "");
}


function polynomialLatex(a, b) {

    let result = "";


    if (a !== 0) {

        if (a === 1) {

            result += "x";

        } else if (a === -1) {

            result += "-x";

        } else {

            result +=
                numLatex(a) + "x";
        }
    }


    if (b !== 0) {

        if (result === "") {

            result =
                numLatex(b);

        } else if (b > 0) {

            result +=
                "+" + numLatex(b);

        } else {

            result +=
                numLatex(b);
        }
    }


    if (result === "") {

        result = "0";
    }


    return result;
}


function functionLatex(a,b,c,d) {

    return `
        f(x)=
        \\frac{
            ${polynomialLatex(a,b)}
        }{
            ${polynomialLatex(c,d)}
        }
    `;
}


// ======================================================
// FRACTION
// ======================================================

function gcd(a,b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {

        const temp = b;

        b = a % b;

        a = temp;
    }

    return a;
}


function fractionLatex(numerator, denominator) {

    if (denominator === 0) {

        return "\\text{undefined}";
    }


    if (
        Number.isInteger(numerator) &&
        Number.isInteger(denominator)
    ) {

        const divisor =
            gcd(
                numerator,
                denominator
            );


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
            parseHomographic(input);

    } catch (error) {

        showError(error.message);

        return;
    }


    const {
        a,
        b,
        c,
        d
    } = data;


    // ==================================================
    // FUNCTION
    // ==================================================

    document.getElementById(
        "functionDisplay"
    ).innerHTML =
        `$$${functionLatex(a,b,c,d)}$$`;


    // ==================================================
    // COEFFICIENTS
    // ==================================================

    document.getElementById(
        "aValue"
    ).textContent = a;

    document.getElementById(
        "bValue"
    ).textContent = b;

    document.getElementById(
        "cValue"
    ).textContent = c;

    document.getElementById(
        "dValue"
    ).textContent = d;


    // ==================================================
    // c = 0
    // ==================================================

    if (c === 0) {

        document
            .getElementById("results")
            .classList.remove("hidden");


        document
            .getElementById("parameterFormula")
            .innerHTML = "";


        document
            .getElementById("pValue")
            .textContent = "—";


        document
            .getElementById("monotonicityText")
            .textContent =
            "Not a Homographic Function";


        document
            .getElementById("monotonicityText")
            .style.color =
            "var(--yellow)";


        document
            .getElementById("monotonicityIcon")
            .textContent = "≠";


        document
            .getElementById("monotonicityIcon")
            .style.color =
            "var(--yellow)";


        document
            .getElementById("verticalAsymptote")
            .innerHTML =
            "$\\text{Not applicable}$";


        document
            .getElementById("horizontalAsymptote")
            .innerHTML =
            "$\\text{Not applicable}$";


        document
            .getElementById("analysisText")
            .innerHTML = `

                This function is
                <strong>not a homographic function</strong>
                because <strong>c = 0</strong>.

                A homographic function requires
                <strong>c \\neq 0</strong>.

            `;


        document
            .querySelector(".graph-card")
            .classList.add("hidden");


        MathJax.typesetPromise();

        return;
    }


    // ==================================================
    // p = ad - bc
    // ==================================================

    const p =
        a*d - b*c;


    document.getElementById(
        "parameterFormula"
    ).innerHTML =
        `$$p=ad-bc=${p}$$`;


    document.getElementById(
        "pValue"
    ).textContent = p;


    // ==================================================
    // p = 0
    // ==================================================

    if (p === 0) {

        document
            .getElementById("monotonicityText")
            .textContent =
            "Not a Homographic Function";


        document
            .getElementById("monotonicityText")
            .style.color =
            "var(--yellow)";


        document
            .getElementById("monotonicityIcon")
            .textContent = "≠";


        document
            .getElementById("monotonicityIcon")
            .style.color =
            "var(--yellow)";


        document
            .getElementById("verticalAsymptote")
            .innerHTML =
            "$\\text{Not applicable}$";


        document
            .getElementById("horizontalAsymptote")
            .innerHTML =
            "$\\text{Not applicable}$";


        document
            .getElementById("analysisText")
            .innerHTML = `

                Since

                <strong>p = ad - bc = 0</strong>,

                the function is
                <strong>not a homographic function</strong>.

            `;


        document
            .querySelector(".graph-card")
            .classList.add("hidden");


        document
            .getElementById("results")
            .classList.remove("hidden");


        MathJax.typesetPromise();

        return;
    }


    // ==================================================
    // MONOTONICITY
    // ==================================================

    let increasing;


    if (p > 0) {

        increasing = true;


        document
            .getElementById("monotonicityText")
            .textContent =
            "Strictly Increasing";


        document
            .getElementById("monotonicityText")
            .style.color =
            "var(--green)";


        document
            .getElementById("monotonicityIcon")
            .textContent = "↗";


        document
            .getElementById("monotonicityIcon")
            .style.color =
            "var(--green)";

    } else {

        increasing = false;


        document
            .getElementById("monotonicityText")
            .textContent =
            "Strictly Decreasing";


        document
            .getElementById("monotonicityText")
            .style.color =
            "var(--red)";


        document
            .getElementById("monotonicityIcon")
            .textContent = "↘";


        document
            .getElementById("monotonicityIcon")
            .style.color =
            "var(--red)";
    }


    // ==================================================
    // VERTICAL ASYMPTOTE
    // ==================================================

    document
        .getElementById("verticalAsymptote")
        .innerHTML =
        `$$x=${fractionLatex(-d,c)}$$`;


    // ==================================================
    // HORIZONTAL ASYMPTOTE
    // ==================================================

    document
        .getElementById("horizontalAsymptote")
        .innerHTML =
        `$$y=${fractionLatex(a,c)}$$`;


    // ==================================================
    // ANALYSIS
    // ==================================================

    const direction =
        increasing
            ? "strictly increasing"
            : "strictly decreasing";


    document
        .getElementById("analysisText")
        .innerHTML = `

            Since

            <strong>p = ad - bc = ${p}</strong>,

            the function is

            <strong>${direction}</strong>

            on each interval of its domain.

            The vertical asymptote is obtained from

            <strong>cx + d = 0</strong>,

            while the horizontal asymptote is given by

            <strong>y = a/c</strong>.

        `;


    // ==================================================
    // SHOW
    // ==================================================

    document
        .getElementById("results")
        .classList.remove("hidden");


    document
        .querySelector(".graph-card")
        .classList.remove("hidden");


    // ==================================================
    // GRAPH
    // ==================================================

    drawGraph(
        a,
        b,
        c,
        d,
        p
    );


    MathJax.typesetPromise();
}


// ======================================================
// GRAPH
// ======================================================

function drawGraph(a,b,c,d,p) {

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


    const ctx =
        canvas.getContext("2d");


    ctx.scale(dpr,dpr);


    // ==================================================
    // GRAPH SETTINGS
    // ==================================================

    const left =
        45;

    const right =
        width - 20;

    const top =
        20;

    const bottom =
        height - 35;


    const graphWidth =
        right - left;

    const graphHeight =
        bottom - top;


    // ==================================================
    // ASYMPTOTE VALUES
    // ==================================================

    const vertical =
        -d / c;

    const horizontal =
        a / c;


    // ==================================================
    // VIEW WINDOW
    // ==================================================

    let xRange = 8;

    let yRange = 6;


    if (Math.abs(vertical) > 4) {

        xRange =
            Math.abs(vertical) + 5;
    }


    if (Math.abs(horizontal) > 3) {

        yRange =
            Math.abs(horizontal) + 4;
    }


    function sx(x) {

        return left +
            (
                (x + xRange) /
                (2*xRange)
            ) *
            graphWidth;
    }


    function sy(y) {

        return bottom -
            (
                (y + yRange) /
                (2*yRange)
            ) *
            graphHeight;
    }


    // ==================================================
    // BACKGROUND GRID
    // ==================================================

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


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
    // DOTTED VERTICAL ASYMPTOTE
    // ==================================================

    ctx.save();

    ctx.setLineDash([
        5,
        6
    ]);

    ctx.strokeStyle =
        "rgba(251,113,133,0.7)";

    ctx.lineWidth = 1.5;


    if (
        vertical >= -xRange &&
        vertical <= xRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            sx(vertical),
            top
        );

        ctx.lineTo(
            sx(vertical),
            bottom
        );

        ctx.stroke();
    }


    // ==================================================
    // DOTTED HORIZONTAL ASYMPTOTE
    // ==================================================

    ctx.strokeStyle =
        "rgba(96,165,250,0.75)";


    if (
        horizontal >= -yRange &&
        horizontal <= yRange
    ) {

        ctx.beginPath();

        ctx.moveTo(
            left,
            sy(horizontal)
        );

        ctx.lineTo(
            right,
            sy(horizontal)
        );

        ctx.stroke();
    }


    ctx.restore();


    // ==================================================
    // FUNCTION
    // ==================================================

    ctx.strokeStyle =
        p > 0
            ? "#4ade80"
            : "#fb7185";

    ctx.lineWidth = 2.8;

    ctx.lineJoin = "round";

    ctx.lineCap = "round";


    function drawBranch(
        startX,
        endX
    ) {

        ctx.beginPath();

        let started = false;


        const steps = 800;


        for (
            let i = 0;
            i <= steps;
            i++
        ) {

            const x =
                startX +
                (
                    (endX - startX) *
                    i /
                    steps
                );


            const denominator =
                c*x + d;


            if (
                Math.abs(denominator)
                < 0.0001
            ) {

                started = false;

                continue;
            }


            const y =
                (a*x + b) /
                denominator;


            if (
                !Number.isFinite(y) ||
                y < -yRange*3 ||
                y > yRange*3
            ) {

                started = false;

                continue;
            }


            const px =
                sx(x);

            const py =
                sy(y);


            if (!started) {

                ctx.moveTo(px,py);

                started = true;

            } else {

                ctx.lineTo(px,py);
            }
        }


        ctx.stroke();
    }


    // Left branch

    drawBranch(
        -xRange,
        vertical - 0.02
    );


    // Right branch

    drawBranch(
        vertical + 0.02,
        xRange
    );


    // ==================================================
    // ASYMPTOTE LABELS
    // ==================================================

    ctx.font =
        "12px Segoe UI";


    if (
        vertical >= -xRange &&
        vertical <= xRange
    ) {

        ctx.fillStyle =
            "rgba(251,113,133,0.9)";

        ctx.fillText(
            "x = " + formatNumber(vertical),
            sx(vertical) + 7,
            top + 16
        );
    }


    if (
        horizontal >= -yRange &&
        horizontal <= yRange
    ) {

        ctx.fillStyle =
            "rgba(96,165,250,0.95)";

        ctx.fillText(
            "y = " + formatNumber(horizontal),
            left + 8,
            sy(horizontal) - 8
        );
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
// NUMBER FORMAT FOR GRAPH
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
                c,
                d
            } =
                parseHomographic(input);


            const p =
                a*d - b*c;


            if (
                c !== 0 &&
                p !== 0
            ) {

                drawGraph(
                    a,
                    b,
                    c,
                    d,
                    p
                );
            }

        } catch {

            // Do nothing
        }
    }
);