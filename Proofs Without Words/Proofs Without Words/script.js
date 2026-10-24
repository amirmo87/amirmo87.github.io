// ======================================================
// PROOFS DATA
// Add each proof here. Replace the video path with your
// own file (e.g. "videos/pythagoras.mp4") or a YouTube /
// Vimeo embed link.
// ======================================================

const proofs = [
    {
        title: "Pythagorean Theorem",
        description: "Four identical right triangles arranged around a square reveal that the squares on the two legs add up to the square on the hypotenuse.",
        tag: "Geometry",
        type: "video",          // "video" for mp4/webm, "embed" for YouTube/Vimeo
        src: "GarfieldWordless.mp4"
    },
    {
        title: "Wilson’s Theorem",
        description: "A neat test for primality: the factorial just before p, plus one, is divisible by p exactly when p is prime.",
        tag: "Number Theory",
        type: "video",
        src: "WilsonTheorem.mp4"
    },
    {
        title: "Sum of Triangular Numbers",
        description: "Two copies of a staircase of dots fit together into a rectangle, which makes the formula for the sum easy to see.",
        tag: "Algebra",
        type: "video",
        src: "videos/triangular.mp4"
    },

    {
        title: "AM-GM Inequality for Two Non-negative Real Numbers",
        description: "The average of two numbers is never smaller than the square root of their product.",
        tag: "Geometry",
        type: "video",
        src: "AMGMGeometricProof.mp4"
    }

];


// ======================================================
// DOM ELEMENTS
// ======================================================

const proofsGrid = document.getElementById("proofsGrid");
const emptyState = document.getElementById("emptyState");


// ======================================================
// RENDER FUNCTIONS
// ======================================================

function createMediaElement(proof) {
    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";

    if (proof.type === "embed") {
        const iframe = document.createElement("iframe");
        iframe.src = proof.src;
        iframe.title = proof.title;
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        wrapper.appendChild(iframe);
    } else {
        const video = document.createElement("video");
        video.src = proof.src;
        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;
        wrapper.appendChild(video);
    }

    return wrapper;
}

function createProofCard(proof, index) {
    const card = document.createElement("article");
    card.className = "proof-card";
    card.style.animationDelay = `${0.1 + index * 0.1}s`;

    const info = document.createElement("div");
    info.className = "proof-info";

    const tag = document.createElement("span");
    tag.className = "proof-tag";
    tag.textContent = proof.tag;

    const title = document.createElement("h3");
    title.className = "proof-title";
    title.textContent = proof.title;

    const description = document.createElement("p");
    description.className = "proof-description";
    description.textContent = proof.description;

    info.append(tag, title, description);
    card.append(createMediaElement(proof), info);

    return card;
}

function renderProofs() {
    proofsGrid.innerHTML = "";

    if (proofs.length === 0) {
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    proofs.forEach((proof, index) => {
        proofsGrid.appendChild(createProofCard(proof, index));
    });
}


// ======================================================
// INIT
// ======================================================

renderProofs();
