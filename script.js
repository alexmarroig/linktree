function toggleMode() {
  const html = document.documentElement
  html.classList.toggle("light")

  // pegar a tag img
  const img = document.querySelector("#profile img")
  // substuir a imagem
  if (html.classList.contains("light")) {
    // se tiver light mode, adicionar a imagem light
    img.setAttribute("src", "./assets/assets/cavfreitas2.png")
    // se tiver sem light mode, manter a imagem normal
  } else {
    img.setAttribute("src", "./assets/assets/cavfreitas.png")
  }
}
