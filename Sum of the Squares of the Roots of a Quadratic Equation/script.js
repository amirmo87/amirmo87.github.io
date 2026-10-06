// ======================================================
// DOM ELEMENTS
// ======================================================

const functionInput = document.getElementById("functionInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const errorMessage = document.getElementById("errorMessage");
const resultsDiv = document.getElementById("results");
const nValueInput = document.getElementById("nValue");
const calculateNBtn = document.getElementById("calculateNBtn");

// ======================================================
// GLOBAL VARIABLES
// ======================================================

let globalA, globalB, globalC;
let globalDelta, globalRoot1, globalRoot2;
let globalS, globalP;


// ======================================================
// UTILITY FUNCTIONS
// ======================================================

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
}

function hideError() {
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
}

function showResults() {
    resultsDiv.classList.remove("hidden");
    
    // Trigger MathJax to render formulas
    if (window.MathJax) {
        MathJax.typesetPromise([resultsDiv]).then(() => {
            setTimeout(() => {
                resultsDiv.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }).catch(err => console.log(err));
    } else {
        setTimeout(() => {
            resultsDiv.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }
}

function hideResults() {
    resultsDiv.classList.add("hidden");
}

function toLatexNumber(num) {
    if (Number.isInteger(num)) {
        return num.toString();
    }
    
    // Check if it's close to a simple fraction
    for (let den = 1; den <= 100; den++) {
        for (let num_i = -1000; num_i <= 1000; num_i++) {
            if (Math.abs(num_i / den - num) < 1e-10) {
                if (den === 1) return num_i.toString();
                return `\\frac{${num_i}}{${den}}`;
            }
        }
    }
    
    return (Math.round(num * 1000000) / 1000000).toString();
}


// ======================================================
// PARSE QUADRATIC FUNCTION
// ======================================================

function parseQuadratic(input) {
    // Clean input
    input = input
        .replace(/\s/g, "")
        .replace(/−/g, "-")
        .replace(/f\(x\)\s*=/i, "")
        .replace(/y\s*=/i, "")
        .toLowerCase();

    if (!input) {
        throw new Error("Please enter a function.");
    }

    let a = 0, b = 0, c = 0;
    
    // Find x^2 term
    const x2Match = input.match(/([+-]?\d*\.?\d*)\*?x\^2/);
    if (x2Match) {
        let coef = x2Match[1];
        if (coef === "" || coef === "+") {
            a = 1;
        } else if (coef === "-") {
            a = -1;
        } else {
            a = parseFloat(coef);
        }
    }

    if (a === 0) {
        throw new Error("This is not a quadratic equation. Coefficient of x² must be non-zero.");
    }

    // Remove x^2 term for next parsing
    input = input.replace(/[+-]?\d*\.?\d*\*?x\^2/, "");

    // Find x term (but not x^2 or higher)
    const xMatch = input.match(/([+-]?\d*\.?\d*)\*?x(?!\^)/);
    if (xMatch) {
        let coef = xMatch[1];
        if (coef === "" || coef === "+") {
            b = 1;
        } else if (coef === "-") {
            b = -1;
        } else {
            b = parseFloat(coef);
        }
    }

    // Remove x term
    input = input.replace(/[+-]?\d*\.?\d*\*?x(?!\^)/, "");

    // Find constant term
    const constMatch = input.match(/[+-]?\d+\.?\d*/);
    if (constMatch) {
        c = parseFloat(constMatch[0]);
    }

    if (isNaN(a) || isNaN(b) || isNaN(c)) {
        throw new Error("Invalid quadratic function format. Please use: ax² + bx + c");
    }

    return { a, b, c };
}


// ======================================================
// SOLVE QUADRATIC EQUATION
// ======================================================

function solveQuadraticEquation() {
    hideError();

    try {
        const input = functionInput.value.trim();

        if (!input) {
            throw new Error("Please enter a function.");
        }

        // Parse the input
        const { a, b, c } = parseQuadratic(input);

        globalA = a;
        globalB = b;
        globalC = c;

        // Calculate discriminant
        globalDelta = globalB * globalB - 4 * globalA * globalC;

        // Check if delta is non-negative
        if (globalDelta < 0) {
            throw new Error(`This equation has no real roots! Δ = ${toLatexNumber(globalDelta)} < 0`);
        }

        // Calculate roots
        const sqrtDelta = Math.sqrt(globalDelta);
        globalRoot1 = (-globalB + sqrtDelta) / (2 * globalA);
        globalRoot2 = (-globalB - sqrtDelta) / (2 * globalA);

        // Calculate S (sum) and P (product) using Vieta's formulas
        globalS = globalRoot1 + globalRoot2;
        globalP = globalRoot1 * globalRoot2;

        // Display results
        displayResults();
        showResults();

    } catch (error) {
        showError(error.message);
        hideResults();
    }
}

function displayResults() {
    // Display equation
    const aStr = toLatexNumber(globalA);
    const bStr = globalB >= 0 ? `+ ${toLatexNumber(globalB)}` : `- ${toLatexNumber(Math.abs(globalB))}`;
    const cStr = globalC >= 0 ? `+ ${toLatexNumber(globalC)}` : `- ${toLatexNumber(Math.abs(globalC))}`;
    
    document.getElementById("equationDisplay").innerHTML = 
        `$$f(x) = ${aStr}x^2 \\, ${bStr}x \\, ${cStr} = 0$$`;

    // Display coefficients
    document.getElementById("aValue").innerHTML = toLatexNumber(globalA);
    document.getElementById("bValue").innerHTML = toLatexNumber(globalB);
    document.getElementById("cValue").innerHTML = toLatexNumber(globalC);

    // Display delta formula and value
    document.getElementById("deltaFormula").innerHTML = 
        `$$\\Delta = b^2 - 4ac = (${toLatexNumber(globalB)})^2 - 4 \\cdot ${toLatexNumber(globalA)} \\cdot ${toLatexNumber(globalC)} = ${toLatexNumber(globalDelta)}$$`;
    document.getElementById("deltaValue").innerHTML = `$$${toLatexNumber(globalDelta)}$$`;

    // Display roots
    const root1Str = toLatexNumber(globalRoot1);
    const root2Str = toLatexNumber(globalRoot2);
    
    document.getElementById("root1Value").innerHTML = `$$x_1 = ${root1Str}$$`;
    document.getElementById("root2Value").innerHTML = `$$x_2 = ${root2Str}$$`;

    // Display S and P
    document.getElementById("sValue").innerHTML = 
        `$$S = x_1 + x_2 = -\\frac{b}{a} = -\\frac{${toLatexNumber(globalB)}}{${toLatexNumber(globalA)}} = ${toLatexNumber(globalS)}$$`;
    document.getElementById("pValue").innerHTML = 
        `$$P = x_1 \\cdot x_2 = \\frac{c}{a} = \\frac{${toLatexNumber(globalC)}}{${toLatexNumber(globalA)}} = ${toLatexNumber(globalP)}$$`;

    // Display analysis text
    const analysisText = document.getElementById("analysisText");
    if (Math.abs(globalDelta) < 1e-10) {
        analysisText.innerHTML = `
            <strong>Double Root:</strong> Since $\\Delta = 0$, the equation has one double root: 
            $x_1 = x_2 = ${root1Str}$
        `;
    } else {
        analysisText.innerHTML = `
            <strong>Two Distinct Real Roots:</strong> Since $\\Delta > 0$, the equation has two distinct real roots.
            Sum of roots: $S = ${toLatexNumber(globalS)}$
            Product of roots: $P = ${toLatexNumber(globalP)}$
        `;
    }

    // Reset n value and result
    nValueInput.value = "2";
    document.getElementById("answerValue").textContent = "—";
    document.getElementById("stepByStep").innerHTML = "";
    document.getElementById("stepByStep").classList.remove("show");

    // Render MathJax for all formulas
    if (window.MathJax) {
        MathJax.typesetPromise().catch(err => console.log(err));
    }
}


// ======================================================
// RECURSIVE FORMULA: Aₙ = S·Aₙ₋₁ - P·Aₙ₋₂
// ======================================================

function calculatePowerSum(n) {
    if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
        throw new Error("Please enter a non-negative integer for n.");
    }

    // Initialize array for storing A values
    const A = new Array(n + 1);
    
    // Base cases
    A[0] = 2;
    if (n === 0) return A;
    
    A[1] = globalS;
    if (n === 1) return A;

    // Calculate Aₙ using recursive formula
    for (let i = 2; i <= n; i++) {
        A[i] = globalS * A[i - 1] - globalP * A[i - 2];
    }

    return A;
}

function displayPowerSumResult() {
    try {
        let n = parseFloat(nValueInput.value);

        if (isNaN(n) || n < 0) {
            throw new Error("Please enter a non-negative integer for n.");
        }

        n = Math.floor(n);

        // Calculate power sum
        const A = calculatePowerSum(n);
        const result = A[n];

        // Display result
        document.getElementById("answerValue").innerHTML = `$$${toLatexNumber(result)}$$`;

        // Display step-by-step calculation
        displayStepByStep(n, A);

    } catch (error) {
        showError(error.message);
        document.getElementById("answerValue").textContent = "—";
        document.getElementById("stepByStep").innerHTML = "";
        document.getElementById("stepByStep").classList.remove("show");
    }
}

function displayStepByStep(n, A) {
    const stepDiv = document.getElementById("stepByStep");
    let html = "<strong>Calculation Steps:</strong><br><br>";

    html += `$$A_0 = 2$$<br>`;
    html += `$$A_1 = S = ${toLatexNumber(globalS)}$$<br><br>`;

    if (n >= 2) {
        html += `Using $A_n = S \\cdot A_{n-1} - P \\cdot A_{n-2}$:<br><br>`;

        for (let i = 2; i <= n; i++) {
            html += `$$A_${i} = ${toLatexNumber(globalS)} \\cdot A_${i-1} - ${toLatexNumber(globalP)} \\cdot A_${i-2}$$<br>`;
            html += `$$A_${i} = ${toLatexNumber(globalS)} \\cdot ${toLatexNumber(A[i-1])} - ${toLatexNumber(globalP)} \\cdot ${toLatexNumber(A[i-2])}$$<br>`;
            html += `$$A_${i} = ${toLatexNumber(globalS * A[i-1])} - ${toLatexNumber(globalP * A[i-2])}$$<br>`;
            html += `$$A_${i} = ${toLatexNumber(A[i])}$$<br><br>`;
        }
    }

    html += `<strong>Result:</strong> $$A_${n} = x_1^${n} + x_2^${n} = ${toLatexNumber(A[n])}$$`;

    stepDiv.innerHTML = html;
    stepDiv.classList.add("show");
    
    // Trigger MathJax
    if (window.MathJax) {
        MathJax.typesetPromise([stepDiv]).then(() => {
            // Done
        }).catch(err => console.log(err));
    }
}


// ======================================================
// MATH KEYBOARD
// ======================================================

document.querySelectorAll(".math-key").forEach(btn => {
    btn.addEventListener("click", () => {
        const insert = btn.dataset.insert;
        const input = functionInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        
        let textToInsert = "";
        
        switch(insert) {
            case "^2":
                textToInsert = "^2";
                break;
            case "^3":
                textToInsert = "^3";
                break;
            case "^":
                textToInsert = "^";
                break;
            case "sqrt":
                textToInsert = "sqrt(";
                break;
            case "pi":
                textToInsert = "π";
                break;
            case "alpha":
                textToInsert = "α";
                break;
            case "beta":
                textToInsert = "β";
                break;
            case "±":
                textToInsert = "±";
                break;
        }
        
        const newValue = input.value.substring(0, start) + textToInsert + input.value.substring(end);
        input.value = newValue;
        input.selectionStart = input.selectionEnd = start + textToInsert.length;
        input.focus();
    });
});


// ======================================================
// EVENT LISTENERS
// ======================================================

// Analyze button
analyzeBtn.addEventListener("click", solveQuadraticEquation);

// Enter key in function input
functionInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        solveQuadraticEquation();
    }
});

// Calculate n button
calculateNBtn.addEventListener("click", displayPowerSumResult);

// Enter key in n input
nValueInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        displayPowerSumResult();
    }
});

// Example buttons
document.querySelectorAll(".example-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        functionInput.value = btn.dataset.function;
        solveQuadraticEquation();
    });
});

// Trigger MathJax when page loads
window.addEventListener("load", () => {
    if (window.MathJax) {
        MathJax.contentDocument = document;
        MathJax.typesetPromise().catch(err => console.log(err));
    }
});
