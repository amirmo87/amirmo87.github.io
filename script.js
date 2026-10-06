/* =========================================
   AMIRMO | MATHEMATICS
   Main Homepage JavaScript
   ========================================= */


/* ---------- Navigation ---------- */

const navigationLinks = document.querySelectorAll(".navbar nav a");

navigationLinks.forEach(link => {

    link.addEventListener("click", function (event) {

        const target = this.getAttribute("href");

        if (target && target.startsWith("#")) {

            const section = document.querySelector(target);

            if (section) {

                event.preventDefault();

                section.scrollIntoView({
                    behavior: "smooth"
                });

            }

        }

    });

});


/* ---------- Tool Cards ---------- */

const toolCards = document.querySelectorAll(".tool-card[href]");

toolCards.forEach(card => {

    card.addEventListener("mouseenter", () => {

        const arrow = card.querySelector(".tool-arrow");

        if (arrow) {
            arrow.textContent = "↗";
        }

    });

});


/* ---------- Current Year ---------- */

const yearElement = document.querySelector(".footer-right");

if (yearElement) {

    yearElement.textContent =
        `© ${new Date().getFullYear()}`;

}


/* ---------- Page Load ---------- */

document.addEventListener("DOMContentLoaded", () => {

    document.body.classList.add("page-loaded");

});