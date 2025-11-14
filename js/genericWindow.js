
var $_genericWindow = (function() {
  
  let options = {
    closeButtonAlignment: 'right'
  }

  function closeTargetWindow(targetOverlay) {
    if (!targetOverlay) return
    
    const windowEl = targetOverlay.querySelector('.gwin-window');

    if (!windowEl) return

    windowEl.classList.add('hidden')
    targetOverlay.classList.remove('gwin-fade-in')
    targetOverlay.classList.add('gwin-fade-out')

    setTimeout(() => {
      try {
        document.body.removeChild(targetOverlay)
      } catch {
        // The overlay might not exist anymore at this point, but that's harmless,
        // so ignore this error.
        // If you want to see why this is needed, try removing
        // the try/catch and click on the close button of the window,
        // then quickly press ESCAPE.
      }
    }, 300)
  }

  function init() {
    document.addEventListener("keydown", (event) => {
      if (!event.repeat && event.key === "Escape") {
        const allOverlays = document.querySelectorAll('.gwin-overlay')
        if (allOverlays.length === 0) return
        const topMostOverlay = allOverlays[allOverlays.length - 1]
        closeTargetWindow(topMostOverlay)
      }
    })
  }

  function setOptions(newOptions) {
    if (newOptions.closeButtonAlignment === 'left' ||
        newOptions.closeButtonAlignment === 'right' ||
        newOptions.closeButtonAlignment === 'none') {
      options.closeButtonAlignment = newOptions.closeButtonAlignment
    }
  }

  function newWindow(htmlContent, buttons = [], options = {}) {
    let overlay = document.createElement('div')
    overlay.className = 'gwin-overlay'

    let windowEl = document.createElement('div')
    windowEl.className = 'gwin-window'

    if (options.maxHeight) {
      windowEl.style.maxHeight = options.maxHeight
    }

    let mainArea = document.createElement('div')
    mainArea.className = 'gwin-window-main'
    mainArea.innerHTML = htmlContent

    let buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'gwin-buttons'

    buttons.forEach(button => {
      let btn = document.createElement('button')
      btn.className = 'gwin-button'
      btn.textContent = button.text
      btn.onclick = async () => {
        closeThisWindow()
        await button.onSelect()
      }
      buttonsContainer.appendChild(btn)
    })

    let closeButton
    if (options.closeButtonAlignment !== 'none') {
      closeButton = document.createElement('button')
      closeButton.className = `gwin-close left`
      closeButton.textContent = '×'
      closeButton.onclick = closeThisWindow
      windowEl.appendChild(closeButton)
    }

    function closeThisWindow() {
      closeTargetWindow(overlay)
    }

    overlay.onclick = event => {
      if (event.target === overlay) closeThisWindow()
    }

    windowEl.appendChild(mainArea)
    windowEl.appendChild(buttonsContainer)
    overlay.appendChild(windowEl)
    document.body.appendChild(overlay)

    overlay.classList.add('gwin-fade-in')

    windowEl.classList.add('gwin-popup') //animation

    return {
      window: windowEl,
      overlay,
      closeThisWindow,
    }
  }

  return { init, setOptions, newWindow }

})()
