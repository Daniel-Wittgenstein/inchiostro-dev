
var $_nukeAnimations = (function() {
  
  const GENERIC_ELEMENT_CLASS = $_GENERIC_ELEMENT_CLASS

  function nuke() {
    const style = document.createElement("style")
    style.id = "no-animations"
    style.textContent = `
      * {
        animation: none !important;
        transition: none !important;
      }
    `
    document.head.appendChild(style)

    document.querySelectorAll('.' + GENERIC_ELEMENT_CLASS)
      .forEach(el => el.classList.add('_no-anim-fixed'))
  }

  function unnuke() {
    const style = document.getElementById("no-animations")
    if (style) style.remove()

    document.querySelectorAll('.' + GENERIC_ELEMENT_CLASS)
      .forEach(el => el.classList.remove('_no-anim-fixed'))
  }

  return {
    nuke,
    unnuke,
  }

})()
