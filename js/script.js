const menuButton = document.getElementById("menu-button");
const dropdown = document.getElementById("dropdown");
const menuArrow = document.getElementById("menu-arrow");

// abrir e fechar o menu
menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
   
    dropdown.classList.toggle("open");
    
    menuArrow.style.transform = 
    dropdown.classList.contains("open") ? "rotate(180deg)" : "rotate(0deg)";
});

// fecha se clicar fora

document.addEventListener("click", () => {
    dropdown.classList.remove("open");

    menuArrow.style.transform = "rotate(0deg)";
});