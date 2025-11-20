
var $_nukeAnimations = (function() {

  function nuke() {
    document.body.classList.add('no-anim')
  }


  function unnuke() {
    document.body.classList.remove('no-anim')
  }

  return {
    nuke,
    unnuke,
  }

})()
