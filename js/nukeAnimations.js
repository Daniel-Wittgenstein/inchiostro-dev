
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
  }

  function unnuke() {
    const style = document.getElementById("no-animations")
    if (style) style.remove()
  }

  return {
    nuke,
    unnuke,
  }

})()
