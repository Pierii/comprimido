/* ========================================
   MENU DE FERRAMENTAS
======================================== */

const menuButton = document.getElementById("menu-button");

const dropdown = document.getElementById("dropdown");

const menuArrow = document.querySelector(".menu-arrow");

// abrir e fechar o menu

if (menuButton && dropdown && menuArrow) {

    menuButton.addEventListener("click", (event) => {

        event.stopPropagation();

        dropdown.classList.toggle("open");

        menuArrow.style.transform =
            dropdown.classList.contains("open")
                ? "rotate(180deg)"
                : "rotate(0deg)";

    });

    // fecha se clicar fora

    document.addEventListener("click", () => {

        dropdown.classList.remove("open");

        menuArrow.style.transform = "rotate(0deg)";

    });

}

/* ========================================
   SELEÇÃO DE PDF
======================================== */

const selectButton = document.querySelector(".select-button");

const pdfInput = document.getElementById("pdf-input");

if (selectButton && pdfInput) {

    selectButton.addEventListener("click", () => {

        pdfInput.click();

    });

}

/* ========================================
   PÁGINA ATUAL / MENU ATIVO
======================================== */

const currentPage = window.location.pathname.split("/").pop();

const params = new URLSearchParams(window.location.search);

const developmentPage = params.get("pagina");

const pageToHighlight =
    currentPage === "desenvolvimento.html"
        ? developmentPage
        : currentPage;

const menuItems = document.querySelectorAll(".dropdown-item");

menuItems.forEach((item) => {

    const itemPage = item.getAttribute("href");

    if (itemPage === pageToHighlight) {

        item.classList.add("active");

    }

});