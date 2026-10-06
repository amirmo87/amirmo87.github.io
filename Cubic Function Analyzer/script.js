const input = document.getElementById("functionInput");
const calculateBtn = document.getElementById("calculateBtn");
const resultsSection = document.getElementById("resultsSection");

const deltaResult = document.getElementById("deltaResult");
const inflectionResult = document.getElementById("inflectionResult");
const slopeResult = document.getElementById("slopeResult");
const extremum1Result = document.getElementById("extremum1Result");
const extremum2Result = document.getElementById("extremum2Result");
const rootsResult = document.getElementById("rootsResult");

const graphCanvas = document.getElementById("functionCanvas");
const graphFunctionDisplay =
    document.getElementById("graphFunctionDisplay");

const graphContext = graphCanvas.getContext("2d");


/* =========================
   MATH KEYBOARD
========================= */

document.querySelectorAll(".math-keyboard button[data-value]")
    .forEach(button => {

        button.addEventListener("click", () => {

            const value = button.dataset.value;

            const start = input.selectionStart;
            const end = input.selectionEnd;

            input.value =
                input.value.substring(0, start) +
                value +
                input.value.substring(end);

            input.focus();

            input.setSelectionRange(
                start + value.length,
                start + value.length
            );
        });

    });


document.getElementById("clearInput")
    .addEventListener("click", () => {
        input.value = "";
        input.focus();
    });


document.getElementById("backspace")
    .addEventListener("click", () => {

        const start = input.selectionStart;
        const end = input.selectionEnd;

        if (start !== end) {

            input.value =
                input.value.substring(0, start) +
                input.value.substring(end);

            input.setSelectionRange(start, start);

        } else if (start > 0) {

            input.value =
                input.value.substring(0, start - 1) +
                input.value.substring(end);

            input.setSelectionRange(start - 1, start - 1);
        }

        input.focus();
    });


/* =========================
   NUMBER → FRACTION
========================= */

function gcd(a, b) {

    a = Math.abs(a);
    b = Math.abs(b);

    while (b !== 0) {
        const temp = a % b;
        a = b;
        b = temp;
    }

    return a;
}


function decimalToFraction(value) {

    if (!Number.isFinite(value)) {
        return String(value);
    }

    if (Math.abs(value - Math.round(value)) < 1e-10) {
        return String(Math.round(value));
    }

    const sign = value < 0 ? -1 : 1;
    value = Math.abs(value);

    const maxDenominator = 1000;

    let bestNumerator = Math.round(value);
    let bestDenominator = 1;
    let bestError = Math.abs(value - bestNumerator);

    for (
        let denominator = 1;
        denominator <= maxDenominator;
        denominator++
    ) {

        const numerator = Math.round(value * denominator);
        const error =
            Math.abs(value - numerator / denominator);

        if (error < bestError) {

            bestError = error;
            bestNumerator = numerator;
            bestDenominator = denominator;

        }

        if (bestError < 1e-10) {
            break;
        }
    }

    const divisor =
        gcd(bestNumerator, bestDenominator);

    bestNumerator /= divisor;
    bestDenominator /= divisor;

    bestNumerator *= sign;

    if (bestDenominator === 1) {
        return String(bestNumerator);
    }

    return `
        <span class="fraction">
            <span class="numerator">${bestNumerator}</span>
            <span class="denominator">${bestDenominator}</span>
        </span>
    `;
}


/* =========================
   POINT FORMAT
========================= */

function formatPoint(x, y) {

    return `
        (
        ${decimalToFraction(x)},
        ${decimalToFraction(y)}
        )
    `;
}


/* =========================
   FUNCTION PARSER
========================= */

function parseCubicFunction(str) {

    str = str
        .replace(/\s+/g, "")
        .replace(/X/g, "x")
        .replace(/×/g, "*")
        .replace(/−/g, "-")
        .replace(/³/g, "^3")
        .replace(/²/g, "^2");

    if (!str) {
        throw new Error("Please enter a function.");
    }


    /*
        Add + before positive terms.
    */

    if (str[0] !== "+" && str[0] !== "-") {
        str = "+" + str;
    }


    const terms =
        str.match(/[+-][^+-]+/g);

    if (!terms) {
        throw new Error("Invalid cubic function.");
    }


    let a = 0;
    let b = 0;
    let c = 0;
    let d = 0;


    terms.forEach(term => {

        const sign =
            term[0] === "-" ? -1 : 1;

        let body = term.substring(1);


        if (body.includes("x^3")) {

            let coefficient =
                body.replace("x^3", "");

            if (coefficient === "") {
                coefficient = 1;
            }

            if (coefficient === "*") {
                coefficient = 1;
            }

            a += sign * Number(coefficient);

        }

        else if (body.includes("x^2")) {

            let coefficient =
                body.replace("x^2", "");

            if (coefficient === "") {
                coefficient = 1;
            }

            if (coefficient === "*") {
                coefficient = 1;
            }

            b += sign * Number(coefficient);

        }

        else if (body.includes("x")) {

            let coefficient =
                body.replace("x", "");

            if (coefficient === "") {
                coefficient = 1;
            }

            if (coefficient === "*") {
                coefficient = 1;
            }

            c += sign * Number(coefficient);

        }

        else {

            d += sign * Number(body);

        }

    });


    if (!Number.isFinite(a) || a === 0) {
        throw new Error(
            "The function must be a cubic function."
        );
    }


    if (
        !Number.isFinite(b) ||
        !Number.isFinite(c) ||
        !Number.isFinite(d)
    ) {
        throw new Error(
            "Invalid coefficients."
        );
    }


    return { a, b, c, d };
}


/* =========================
   FORMAT FUNCTION
========================= */

function formatFunction(a, b, c, d) {

    let result = "";


    function addTerm(coefficient, variable, power) {

        if (coefficient === 0) {
            return;
        }

        const abs = Math.abs(coefficient);

        let coefficientText =
            abs === 1 && variable
                ? ""
                : decimalToFraction(abs);

        let term =
            coefficientText + variable;

        if (power === 3) {
            term += "³";
        }

        if (power === 2) {
            term += "²";
        }

        if (result === "") {

            result =
                coefficient < 0
                    ? "-"
                    : "";

            result += term;

        } else {

            result +=
                coefficient < 0
                    ? " − "
                    : " + ";

            result += term;
        }
    }


    addTerm(a, "x", 3);
    addTerm(b, "x", 2);
    addTerm(c, "x", 1);
    addTerm(d, "", 0);


    return result;
}


/* =========================
   GRAPH
========================= */

function drawFunctionGraph(a, b, c, d, inflectionX) {

    const rect =
        graphCanvas.getBoundingClientRect();

    const dpr =
        window.devicePixelRatio || 1;


    graphCanvas.width =
        rect.width * dpr;

    graphCanvas.height =
        rect.height * dpr;


    graphContext.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );


    const width = rect.width;
    const height = rect.height;


    graphContext.clearRect(
        0,
        0,
        width,
        height
    );


    /*
        Find extrema to build a useful
        automatic viewing window.
    */

    const delta =
        b * b - 3 * a * c;

    let importantX = [inflectionX];


    if (delta > 0) {

        const sqrtDelta =
            Math.sqrt(delta);

        const x1 =
            (-b - sqrtDelta) / (3 * a);

        const x2 =
            (-b + sqrtDelta) / (3 * a);

        importantX.push(x1, x2);
    }


    let xMin =
        Math.min(...importantX);

    let xMax =
        Math.max(...importantX);


    const center =
        (xMin + xMax) / 2;

    let range =
        Math.max(xMax - xMin, 4);


    xMin =
        center - range * 1.8;

    xMax =
        center + range * 1.8;


    function f(x) {

        return (
            a * x * x * x +
            b * x * x +
            c * x +
            d
        );
    }


    /*
        Find y-range by sampling the
        exact cubic function.
    */

    let yMin = Infinity;
    let yMax = -Infinity;


    for (let i = 0; i <= 700; i++) {

        const x =
            xMin +
            (xMax - xMin) *
            (i / 700);

        const y = f(x);

        if (Number.isFinite(y)) {

            yMin =
                Math.min(yMin, y);

            yMax =
                Math.max(yMax, y);
        }
    }


    if (!Number.isFinite(yMin) ||
        !Number.isFinite(yMax)) {

        yMin = -10;
        yMax = 10;
    }


    const yCenter =
        (yMin + yMax) / 2;

    let yRange =
        Math.max(yMax - yMin, 4);


    yMin =
        yCenter - yRange * 0.12;

    yMax =
        yCenter + yRange * 0.12;


    /*
        Keep enough room vertically.
    */

    const actualRange =
        yMax - yMin;

    yMin =
        yCenter - actualRange * 0.65;

    yMax =
        yCenter + actualRange * 0.65;


    const padding = 35;


    function mapX(x) {

        return padding +
            (x - xMin) /
            (xMax - xMin) *
            (width - padding * 2);
    }


    function mapY(y) {

        return height - padding -
            (y - yMin) /
            (yMax - yMin) *
            (height - padding * 2);
    }


    /*
        GRID
    */

    graphContext.lineWidth = 1;
    graphContext.strokeStyle =
        "rgba(255,255,255,0.045)";

    const gridCount = 10;


    for (let i = 0; i <= gridCount; i++) {

        const x =
            padding +
            i / gridCount *
            (width - padding * 2);

        graphContext.beginPath();
        graphContext.moveTo(x, padding);
        graphContext.lineTo(x, height - padding);
        graphContext.stroke();


        const y =
            padding +
            i / gridCount *
            (height - padding * 2);

        graphContext.beginPath();
        graphContext.moveTo(padding, y);
        graphContext.lineTo(width - padding, y);
        graphContext.stroke();
    }


    /*
        AXES
    */

    graphContext.strokeStyle =
        "rgba(234,241,255,0.25)";

    graphContext.lineWidth = 1.2;


    if (xMin <= 0 && xMax >= 0) {

        const zeroX = mapX(0);

        graphContext.beginPath();
        graphContext.moveTo(zeroX, padding);
        graphContext.lineTo(
            zeroX,
            height - padding
        );
        graphContext.stroke();

    }


    if (yMin <= 0 && yMax >= 0) {

        const zeroY = mapY(0);

        graphContext.beginPath();
        graphContext.moveTo(
            padding,
            zeroY
        );

        graphContext.lineTo(
            width - padding,
            zeroY
        );

        graphContext.stroke();

    }


    /*
        AXIS LABELS
    */

    graphContext.fillStyle =
        "rgba(143,165,197,0.7)";

    graphContext.font =
        '11px "DM Mono"';


    if (xMin <= 0 && xMax >= 0) {

        const zeroX = mapX(0);

        graphContext.fillText(
            "y",
            zeroX + 8,
            padding + 10
        );
    }


    if (yMin <= 0 && yMax >= 0) {

        const zeroY = mapY(0);

        graphContext.fillText(
            "x",
            width - padding - 12,
            zeroY - 8
        );
    }


    /*
        EXACT CUBIC CURVE
    */

    graphContext.strokeStyle =
        "#6da8ff";

    graphContext.lineWidth = 3;

    graphContext.lineJoin = "round";
    graphContext.lineCap = "round";

    graphContext.beginPath();


    for (let i = 0; i <= 1000; i++) {

        const x =
            xMin +
            (xMax - xMin) *
            (i / 1000);

        const y = f(x);

        const px = mapX(x);
        const py = mapY(y);


        if (i === 0) {
            graphContext.moveTo(px, py);
        } else {
            graphContext.lineTo(px, py);
        }
    }


    graphContext.stroke();


    /*
        INFLECTION POINT
    */

    const inflectionY =
        f(inflectionX);

    const px =
        mapX(inflectionX);

    const py =
        mapY(inflectionY);


    if (
        px >= 0 &&
        px <= width &&
        py >= 0 &&
        py <= height
    ) {

        graphContext.beginPath();

        graphContext.arc(
            px,
            py,
            5,
            0,
            Math.PI * 2
        );

        graphContext.fillStyle =
            "#07111f";

        graphContext.fill();

        graphContext.strokeStyle =
            "#6da8ff";

        graphContext.lineWidth = 2;

        graphContext.stroke();


        graphContext.fillStyle =
            "#6da8ff";

        graphContext.font =
            '11px "DM Mono"';

        graphContext.fillText(
            "Pi",
            px + 9,
            py - 9
        );
    }
}


/* =========================
   ANALYZE
========================= */

function analyze() {

    try {

        const rawInput =
            input.value.trim();


        const {
            a,
            b,
            c,
            d
        } = parseCubicFunction(rawInput);


        /*
            DELTA
        */

        const delta =
            b * b - 3 * a * c;

        deltaResult.innerHTML =
            decimalToFraction(delta);


        /*
            INFLECTION POINT
        */

        const inflectionX =
            -b / (3 * a);

        const inflectionY =
            a * Math.pow(inflectionX, 3) +
            b * Math.pow(inflectionX, 2) +
            c * inflectionX +
            d;


        inflectionResult.innerHTML =
            formatPoint(
                inflectionX,
                inflectionY
            );


        /*
            SLOPE
        */

        const slope =
            -delta / (3 * a);

        slopeResult.innerHTML =
            decimalToFraction(slope);


        /*
            EXTREMA
        */

        extremum1Result.innerHTML = "";
        extremum2Result.innerHTML = "";


        if (delta > 0) {

            const sqrtDelta =
                Math.sqrt(delta);


            const ex1 =
                (-b - sqrtDelta) /
                (3 * a);

            const ex2 =
                (-b + sqrtDelta) /
                (3 * a);


            const ey1 =
                a * Math.pow(ex1, 3) +
                b * Math.pow(ex1, 2) +
                c * ex1 +
                d;


            const ey2 =
                a * Math.pow(ex2, 3) +
                b * Math.pow(ex2, 2) +
                c * ex2 +
                d;


            extremum1Result.innerHTML =
                formatPoint(ex1, ey1);


            extremum2Result.innerHTML =
                formatPoint(ex2, ey2);


            /*
                ROOT COUNT
            */

            const product =
                ey1 * ey2;


            const tolerance = 1e-9;


            if (Math.abs(product) < tolerance) {

                rootsResult.innerHTML =
                    "1 simple + 1 double root";

            }

            else if (product < 0) {

                rootsResult.innerHTML =
                    "3 simple real roots";

            }

            else {

                rootsResult.innerHTML =
                    "1 simple real root";
            }

        }

        else {

            extremum1Result.innerHTML =
                "No Extremum";

            extremum2Result.innerHTML =
                "No Extremum";

            rootsResult.innerHTML =
                "1 simple real root";
        }


        /*
            SHOW RESULTS
        */

        resultsSection.classList.remove("hidden");


        /*
            IMPORTANT:
            Display EXACTLY what the user typed.
        */

        graphFunctionDisplay.textContent =
            rawInput;


        /*
            DRAW THE EXACT CUBIC
            REPRESENTED BY THE USER INPUT.
        */

        drawFunctionGraph(
            a,
            b,
            c,
            d,
            inflectionX
        );

    }

    catch (error) {

        alert(error.message);

    }
}


/* =========================
   BUTTON
========================= */

calculateBtn.addEventListener(
    "click",
    analyze
);


/* ENTER KEY */

input.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            analyze();
        }

    }
);


/* =========================
   RESIZE
========================= */

window.addEventListener(
    "resize",
    () => {

        if (
            resultsSection.classList.contains(
                "hidden"
            )
        ) {
            return;
        }


        try {

            const {
                a,
                b,
                c,
                d
            } = parseCubicFunction(
                input.value.trim()
            );


            const inflectionX =
                -b / (3 * a);


            drawFunctionGraph(
                a,
                b,
                c,
                d,
                inflectionX
            );

        }

        catch (_) {}

    }
);