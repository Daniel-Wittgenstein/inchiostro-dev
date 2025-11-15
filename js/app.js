
;(function(storyContent) {

  // ##################################################
  // ##################################################
  // Stuff you can (hopefully) change without worrying:
  // ##################################################
  // ##################################################
  
  const ALLOW_UNDEFINED_IMAGE = true // If an asset map or
    // an asset definition exists and this is false,
    // a helpful error message will be shown when the image
    // does not exist. If an asset map or an asset
    // definition exists and this is true, Inchiostro
    // will try to load the image even though it does not exist
    // in the asset map / the asset definitions.

  const ALLOW_UNDEFINED_AUDIO = true // Same for audio.

  const AMBIENT_FADE_IN_TIME = 800 // milliseconds
  const AMBIENT_FADE_OUT_TIME = 800 // milliseconds


  // ##################################################
  // ##################################################
  // ##################################################
  // ##################################################
  // ##################################################
  // ##################################################
  
  const loadAssets = window.$_loadAssets
  const ambientManager = window.$_ambientManager
  const store = window.$_store
  const genericWindow = window.$_genericWindow
  const SaveSlotManager = window.$_SaveSlotManager
  const i18n = $_i18n
  const settings = $_settings
  const random = $_random

  const MAGICAL_CHOICE_CONTAINER_STRING = "no-conflict-choice-containerX073223218"

  const pathPrefix = "assets/"

  const allowedDebugCommands = new Set(["commands"])

  let story, top, mid, bottom, commandManager, saveSlotManager,
    restartStoryInitialState, currentOutputContainer, storyAssets,
    currentSaveMarker, currentTurnAbortController, allAssetFileNamesForErrorDisplay,
    xAssetMapExistsForErrorDisplay, assetsWerePreloaded
  
  let undoStack = []


  async function startApp(assets) {
    
    assetsWerePreloaded = !!assets

    storyAssets = assets || {}

    document.getElementById("splash-screen").style.display = "none"

    console.log("assets", assets)

    setCurrentOutputContainer("main")

    genericWindow.init()

    saveSlotManager = new SaveSlotManager({
      onStateLoaded: async (state) => {
        
        // LOAD A STORY FROM SAVE SLOT:

        destroyUndoStack() // not a technical necessity, but
          // like with restart story, it's just weird
          //  when you undo too much
          // and end up in a previous playthrough.
        await restoreFromState(state)
      },
      getStateToSave: () => currentSaveMarker,
      getSaveSlotText: () => {
        const str = story.variablesState["saveSlotText"]
        if (!(typeof str === "string")) {
          return ""
        }
        const text = resolveVarContainingString(str, story.variablesState)
        return text
      }
    }, {
      saveSlotAmount: 8,
      texts: {
        load: i18n.saveSlotLoad,
        save: i18n.saveSlotSave,
        clear: i18n.saveSlotClear,
        emptySlot: i18n.saveSlotEmpty,
      }
    })

    story = new inkjs.Story(storyContent)

    story.onError = (msg) => {
      authorError("INK ERROR: " + msg)
    }

    console.log("story", story)
    window.story = story

    top = document.querySelector('#top')
    main = document.querySelector('#main')
    bottom = document.querySelector('#bottom')

    applySettingsAtstartup()

    initHandlers()

    commandManager = new CommandManager()

    createCommands()

    refreshUndoIcon()

    restartStoryInitialState = getState()

    // at app start: start story:
    await takeTurn(true)

  }


  function applySettingsAtstartup() {
    settings.loadState()
    if (settings.get("muted")) {
      muteApp()
    } else {
      unmuteApp()
    }
  }


  function clickRestartStory() {
    genericWindow.newWindow(i18n.reallyRestart, [
      {
        text: i18n.reallyRestartConfirm,
        onSelect: async () => {
          await restartStory()
        },
      },
      {
        text: i18n.reallyRestartCancel,
        onSelect: () => {
          //do nothing
        },
      },
    ])
  }


  async function restartStory() {
    destroyUndoStack() // not a technical necessity, but it's just weird
    //  when you undo too much
    // and end up in a previous playthrough.
    await restoreFromState(restartStoryInitialState)
  }


  function resolveVarContainingString(str, varMap) {
    return str.replace(/&\((.*?)\)/g, (_, key) => varMap[key]) 
  }


  function getState() {
    return {
      $$_isAppState: true,
      store: store.getStoreState(),
      story: story.state.toJson(),
      ambientManager: ambientManager.getState(),
      domState: getDomState(),
    }
  }


  async function restoreFromState(state) {
    if (!state.$$_isAppState) throw new Error(`Passed invalid state object.`)
    const result = store.setStoreState(state.store)
    if (!result) {
      throw new Error(`Not a valid store state.`)
    }
    abortCurrentTurn() // so pending awaits don't keep running, writing stuff
      // to the DOM, executing commands etc.
    flushContainers()
    story.state.LoadJson(state.story)
    ambientManager.stopAmbient(0)
    ambientManager.setState(state.ambientManager, storyAssets)
    setDomState(state.domState)
    const contId = store.get("out", "main")
    setCurrentOutputContainer(contId)
    refreshUndoIcon()
    restoreSeed()

    // and finally:
    takeTurn(false)
  }


  function abortCurrentTurn() {
    
  }


  function toggleMute() {
    const muted = settings.get("muted")
    if (!muted) {
      muteApp()
    } else {
      unmuteApp()
    }
  }


  function muteApp() {
    const el = document.getElementById("audio-button")
    el.classList.add("muted")
    settings.set("muted", true)
    Howler.mute(true)
    console.log("muted")
  }


  function unmuteApp() {
    const el = document.getElementById("audio-button")
    el.classList.remove("muted")
    settings.set("muted", false)
    Howler.mute(false)
    console.log("unmuted")
  }


  function refreshUndoIcon() {
    const el = document.getElementById("undo-button")
    if (isUndoPossible()) {
      el.style.opacity = 1
    } else {
      el.style.opacity = 0.3
    }
  }


  function addUndoState() {
    undoStack.push(getState())
    while (undoStack.length > store.get("maxUndo")) {
      undoStack.shift()
    }
    refreshUndoIcon()
  }


  function isUndoPossible() {
    return undoStack.length > 0
  }


  async function requestUndo() {
    if (!isUndoPossible()) {
      return
    }
    const state = undoStack.pop()
    await restoreFromState(state)
  }


  function destroyUndoStack() {
    undoStack = []
  }


  function getDomState() {
    const serializedContainers = {}
    document.querySelectorAll('.persist').forEach(el => {
      const id = el.id
      if (!el.id) {
        console.error(el)
        const msg = `An element has class "persist", but no id. This is not allowed. ` +
          `Fatal error. Please reload the page.`
        authorError(msg)
        throw new Error(msg)
      }
      serializedContainers[id] = serializeContainer(el)
    })
    return {
      serializedContainers,
    }
  }


  function setDomState(state) {
    for (const id of Object.keys(state.serializedContainers)) {
      const el = document.getElementById(id)
      if (!el) {
        const msg = `No element with id "${id}" found.` +
          `Fatal error. Please reload the page.`
        authorError(msg)
        throw new Error(msg)
      }
      const val = state.serializedContainers[id]
      el.innerHTML = deserializeContainer(val)
    }
  }


  function initHandlers() {
    document.addEventListener('click', async (e) => {
      if (e.target.classList.contains('choice')) {
        const index = Number(e.target.dataset.inkIndex)
        if (!index && index !== 0) {
          console.log("Invalid choice. Do not give class 'choice' to random elements.")
          return
        }
        await selectChoice(index)
      }
    })

    document.getElementById("save-load-button").title = i18n.saveLoadButtonTitle

    document.getElementById("save-load-button").addEventListener("click", 
      (event) => {
        event.target?.blur() // Otherwise we can hit enter or space multiple
        // times in a row opening several save slot dialogs, which is confusing
        // for the user. (We still can do that if we deliberately refocus the
        // button even if it's hidden by the overlay, but it's a lot harder to do
        // accidentally now.)
        saveSlotManager.openSaveSlotDialog()
      }
    )

    document.getElementById("restart-button").title = i18n.restartButtonTitle

    document.getElementById("restart-button").addEventListener("click", 
      (event) => {
        event.target?.blur()
        clickRestartStory()
      }
    )


    document.getElementById("audio-button").title = i18n.audioButtonTitle

    document.getElementById("audio-button").addEventListener("click", 
      (event) => {
        //no blur here
        toggleMute()
      }
    )


    document.getElementById("undo-button").title = i18n.undoButtonTitle
    document.getElementById("undo-button").addEventListener("click", 
      async (event) => {
        //no blur here
        await requestUndo()
      }
    )

  }


  function serializeContainer(container) {
    const clone = container.cloneNode(true)

    clone.querySelectorAll(`.${MAGICAL_CHOICE_CONTAINER_STRING}`).forEach(child => child.remove())

    clone.querySelectorAll('img[src^="data:"], video[src^="data:"], audio[src^="data:"]').
      forEach(el => {el.removeAttribute('src')
    })

    return clone.innerHTML
  }


  function deserializeContainer(htmlString) {

    function getData(assetId) {
      const asset = storyAssets[assetId]
      if (!asset) {
        return pathPrefix + assetId
      }
      return asset.src
    }

    const container = document.createElement('div')
    container.innerHTML = htmlString

    const mediaElements = container.querySelectorAll('img, audio, video')
    mediaElements.forEach(el => {
      const assetId = el.dataset.inchAssetName
      if (assetId) {
        el.src = getData(assetId)
      }
    })

    return container.innerHTML
  }



  async function selectChoice(index) {
    addUndoState()
    story.ChooseChoiceIndex(index)
    flushContainers()
    await takeTurn(false)
  }


  function flushContainers() {
    document.querySelectorAll('.persist').forEach(el => {
      el.innerHTML = ""
    })
  }


  function authorError(msg, originalText = "") {

    /* The story author did something wrong, for example used a command wrong: */
    const paragraphElement = document.createElement('div')
    paragraphElement.innerHTML = `
      <div class="error">
        ERROR: 
        <div class="error-original-text">${originalText}</div>
        <div class="error-message">${msg}</div>
      </div>
    `
    main.appendChild(paragraphElement) //always attach to main,
    // not to currentOutputContainer
    console.error(msg)
  }


  function setSaveMarker() {
    // Stores the current state into the save marker.

    // When the player saves the game, the app does NOT actually
    // save the current app state, but the state inside the state marker.

    // This is so that intermediary DOM states do not get saved.

    // (Yes, we save the actual DOM state as HTML, not some abstract
    // representation of it.)

    currentSaveMarker = getState()

  }

  
  async function elementPause() {
    const delay = store.get("elementPause")
    if (delay) {
      await sleep(delay)
    }
  }


  async function choicePause() {
    const delay = store.get("choicePause")
    if (delay) {
      await sleep(delay)
    }
  }


  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }


  async function continueInk(signal) {
    while(story.canContinue) {
      
      const paragraphText = story.Continue()

      if (paragraphText.trim().startsWith("$")) {
        // text is special command:

        const result = commandManager.processCommandString(paragraphText)
        if (typeof result === 'string') {
          authorError(result)
        }

        const dispatchResult = await dispatchCommand(result.id, result.paramData,
          paragraphText
        )
        if (signal.aborted) return

        if (store.get("debug_commands")) {
          const paragraphElement = document.createElement('p')
          paragraphElement.innerHTML = 
            "<span class='dbgcom-human'>" + (dispatchResult?.debugMsg || "") + "</span>" +
            "<br>" +
            "<span class='dbgcom-org'>" +
            paragraphText +
            "</span>" +
            "<br>" +
            "<span class='dbgcom-params'>" +
            `${result.id} -> parameters: ${JSON.stringify(result.paramData)}
            </span>
            <br>`
            paragraphElement.classList.add("debug-show-special-command")
          main.appendChild(paragraphElement) //always write debug info
          // to main, not to currentOutputContainer
        }


      } else {

        await elementPause()
        if (signal.aborted) return

        const paragraphElement = document.createElement('p')
        paragraphElement.innerHTML = paragraphText
        currentOutputContainer.appendChild(paragraphElement)

      }

    }
  }


  async function createChoices(signal) {
    const choicesList = getShuffledChoicesList(
      story.currentChoices, store.get("shuffleChoices")
    )

    const choiceContainer = document.createElement("div")
    choiceContainer.classList.add(MAGICAL_CHOICE_CONTAINER_STRING)
    currentOutputContainer.appendChild(choiceContainer)

    let index = -1
    for (const choice of choicesList) {
      index++
      await choicePause()
      if (signal.aborted) return
      const choiceParagraphElement = document.createElement('p')
      choiceParagraphElement.classList.add('choice-outer')
      choiceParagraphElement.innerHTML = 
        `<button class='choice' 
        data-ink-index='${index}'>${choice.text}</button>`
      choiceContainer.appendChild(choiceParagraphElement)
    }

  }

  async function takeTurn(firstTime) {

    // If there is already a turn running, abort it:
    if (currentTurnAbortController) {
      currentTurnAbortController.abort()
    }

    // Create a new abort controller for this turn:
    currentTurnAbortController = new AbortController()
    const signal = currentTurnAbortController.signal

    let processTestId = new Date() // Only used by traceFlow.
    const traceFlow = false // Set to true to console.log the async
                            // flow. (Not that it's particularly complex.)

    traceFlow && console.log("start turn process", processTestId)

    setSaveMarker() // Remembers the state before the turn.
      // If the player clicks "save" while the turn is still running,
      // this is the position that will actually get saved, not some partially
      // populated DOM state. This means that loading a save game
      // will bump you back to the beginning of the last turn UNLESS
      // the turn was entirely completed when you saved.

    traceFlow && console.log("process awaiting ink content", processTestId)

    await continueInk(signal)
    if (signal.aborted) {
      traceFlow && console.log("process", processTestId, "aborted")
      return //very important
    }

    traceFlow && console.log("process awaiting choices", processTestId)

    await createChoices(signal)
    if (signal.aborted) {
      traceFlow && console.log("process", processTestId, "aborted")
      return //very important
    }

    setSaveMarker() // The turn is complete, so remember this state.
      // If the player saves now, this will be the state that is saved.
      // If you restore that state, the turn will not start from scratch
      // and we will not run through the whole Ink content again.
      // (Only through the choices.)

    traceFlow && console.log("process complete", processTestId)

  }





  function getShuffledChoicesList(choicesList, shuffle) {
    if (!shuffle) {
      return choicesList
    }
    return random.shuffle(choicesList)
  }


  function showSimplePopup(htmlContent) {
    genericWindow.newWindow(htmlContent, [], {})
  }


  function setCurrentOutputContainer(elId) {
    const el = document.getElementById(elId)
    if (!el) {
      authorError(`No element with id ${elId} found.`, originalText)
      return
    }
    currentOutputContainer = el
    store.set("out", elId)
  }


  function setSeed(seed) {
    if (seed === undefined) {
      store.set("randomized", true)
      store.set("seed", 0)
      random.randomize()
    } else {
      store.set("randomized", false)
      store.set("seed", seed)
      random.seed(seed)
    }
  }


  function restoreSeed() {
    if (store.get("randomized")) {
      setSeed()
    } else {
      setSeed(store.get("seed"))
    }
  }


  function getImageByPathName(path, ctx, originalText = "") {
    return getAssetByPathName(path, ctx, originalText, ALLOW_UNDEFINED_IMAGE, "image")
  }


  function getAudioByPathName(path, ctx, originalText = "") {
    return getAssetByPathName(path, ctx, originalText, ALLOW_UNDEFINED_AUDIO, "audio")
  }


  function getAssetByPathName(pathName, contextMsg = "", originalText = "",
    allowUndefinedAssets = false, type
  ) {

    if (!assetsWerePreloaded || (
      allowUndefinedAssets && !storyAssets[pathName]
    )) {
      let asset
      if (type === "image") {
        asset = document.createElement("img")
        asset.src = pathName
      } else if (type === "audio") {
        const asset = new Howl({
          src: [pathName],
        })
      } else {
        throw new Error("Unsupported type.")
      }
      return asset
    }

    let val = storyAssets[pathName]
    if (val) return val

    let errText = `No asset with path "${pathName}" exists.`  

    if (allAssetFileNamesForErrorDisplay) {
      errText += 
        `<br><br>Existing assets: 
        ${xAssetMapExistsForErrorDisplay ? "(asset map)" : "(asset definitions)"}<br>` +
        allAssetFileNamesForErrorDisplay.sort().map(n => "<br>" + n)
    }

    authorError(`${contextMsg}: ${errText}`, originalText)

    return null
  }


  // ###########################
  // ###########################
  // ###########################
  // ####### SPECIAL COMMANDS:
  // ###########################
  // ###########################
  // ###########################

  function createCommands() {

    // Here we define the syntax of the special commands,
    // what parameters they support:

    commandManager.addCommand(
      "id_image",       // The command's id. Used by our code to distinguish
                        // between commands.
                        // Must be unique.

      ["image", "img"], // What the story author types to use the command.
                        // You can allow several words for the same command here.
                        
                        // If you type "myCommandName", then
                        // "my_command_name" and "my-command-name" will
                        // automatically work, too.

                        // All commands must start with a $, of course,
                        // but we do not write the $ in this definition.
      
      // the parameters this command supports:
      // ? means that the parameter is optional
      `
        name = string ;
        class = string? ;
        style = string? ;
        alt = string? ;
        type = string? 
      `
    )


    commandManager.addCommand(
      "id_debug",
      ["debug"],
      `$wordList` // no parameter list, instead this command 
                    // will accept a list of single words
    )

    commandManager.addCommand(
      "id_imageType",
      ["imageType", "imgType"],
      `$wordList`
    )


    commandManager.addCommand(
      "id_play",
      ["play"],
      `
        name = string;
        volume = number?
      `
    )

    commandManager.addCommand(
      "id_ambient",
      ["ambient"],
      `
        name = string;
        abrupt = bool?
      `
    )


    commandManager.addCommand(
      "id_stopAmbient",
      ["stopAmbient", "ambientStop"],
      `
        abrupt = bool?
      `
    )


    commandManager.addCommand(
      "id_js",
      ["js"],
      `$string` //raw string as parameter
    )


    commandManager.addCommand(
      "id_popup",
      ["popup"],
      `text = string`
    )


    commandManager.addCommand(
      "id_maxUndo",
      ["maxUndo"],
      `turns = int0+` //int0+ means the parameter must be an integer >= 0
    )


    commandManager.addCommand(
      "id_out",
      ["out"],
      `$singleWord`
    )


    commandManager.addCommand(
      "id_muteApp",
      ["muteApp"],
      `$none`
    )


    commandManager.addCommand(
      "id_unmuteApp",
      ["unmuteApp"],
      `$none`
    )


    commandManager.addCommand(
      "id_shuffleChoicesOn",
      ["shuffleChoicesOn", "shuffleChoices"],
      `$none`
    )


    commandManager.addCommand(
      "id_shuffleChoicesOff",
      ["shuffleChoicesOff"],
      `$none`
    )
    
    
    commandManager.addCommand(
      "id_seed",
      ["seed"],
      `$string`
    )
    
    
    commandManager.addCommand(
      "id_elementPause",
      ["elementPause"],
      `pause = int0+`
    )
    
    
    commandManager.addCommand(
      "id_choicePause",
      ["choicePause"],
      `pause = int0+`
    )


  }



  async function dispatchCommand(commandId, param, originalText) {

    // This is where the special commands actually do stuff:
    
    if (commandId === "id_choicePause") {
      store.set("choicePause", param.pause)

    } else if (commandId === "id_elementPause") {
      store.set("elementPause", param.pause)

    } else if (commandId === "id_seed") {
      let debugText = ""
      if (param.string.trim() === "") {
        setSeed()
        debugText = "RANDOM"
      } else {
        const seed = param.string.trim()
        setSeed(Number(seed))
        debugText = seed
      }
      return  {
        debugMsg: `Set seed to ${debugText}`,
      }

    } else if (commandId === "id_shuffleChoicesOn") {
      store.set("shuffleChoices", true)
      return  {
        debugMsg: `Set shuffle choices to ON.`,
      }

    } else if (commandId === "id_shuffleChoicesOff") {
      store.set("shuffleChoices", false)
      return  {
        debugMsg: `Set shuffle choices to OFF.`,
      }

    } else if (commandId === "id_unmuteApp") {
      unmuteApp()
      return  {
        debugMsg: `Unmute app audio.`,
      }

    } else if (commandId === "id_muteApp") {
      muteApp()
      return  {
        debugMsg: `Mute app audio.`,
      }

    } else if (commandId === "id_out") {
      const elId = param.singleWord
      setCurrentOutputContainer(elId)
      return  {
        debugMsg: `Set output container to #${elId}`,
      }
    }

    else if (commandId === "id_maxUndo") {
      store.set("maxUndo", param.turns)
      refreshUndoIcon()
      return  {
        debugMsg: `Set max undo to: ${param.turns} turns`,
      }
    }

    else if (commandId === "id_popup") {
      showSimplePopup(param.text)
      return  {
        debugMsg: `Show popup with text: ${param.text}`,
      }
    }

    else if (commandId === "id_js") {
      eval(param.string)
      return  {
        debugMsg: `run js: ${param.string}`,
      }
    }


    else if (commandId === "id_image") { // here we check against the id we gave this command

      await elementPause()

      const assetName = param.name

      const imageElement = getImageByPathName(pathPrefix + assetName, "image", originalText)
      
      if (!imageElement) {
        return
      }
      const clonedImage = imageElement.cloneNode()

      clonedImage.alt = param.alt || "" // optional parameter, so if it's undefined,
                                         // we use an empty string
      clonedImage.style = (param.style  || "").replaceAll("%%", ";")
      clonedImage.className = (param.class  || "").replaceAll(",", " ")
      clonedImage.dataset.inchAssetName = assetName

      const cssClasses = store.getCssClassesbyImageType(param.type || "default")
      if (!cssClasses) {
        authorError(`Image type "${param.type}": this type was never defined.`,
          originalText
        )
        return
      }
      for (const cssClass of cssClasses) {
        if (cssClass) clonedImage.classList.add(cssClass)
      }

      currentOutputContainer.appendChild(clonedImage)
      return {
        debugMsg: `Display image "${assetName}"`
      }
    }

    else if (commandId === "id_assetPath") {
      // since this is a single word command, param.singleWord
      // is the only valid parameter:
      let path = param.singleWord
      path = utils.normalizepath(path)
      store.set("assetPath", path)
      return {
        debugMsg: `Set asset path to "${path}"`,
      }
    }

    else if (commandId === "id_debug") {
      for (const word of param.wordList) {
        if (!allowedDebugCommands.has(word)) {
          authorError(`unknown debug command: "${word}"`)
          return
        }
        store.set("debug_" + word, true)
      }
      return
    }

    else if (commandId === "id_imageType") {
      store.setImageType(param.wordList[0], param.wordList.slice(1))
      return {
        debugMsg: `Create image type with name "${param.wordList[0]}" and `+
          `classes "${param.wordList.slice(1)}"`,
      }
    }

    else if (commandId === "id_play") {
      const volume = (param.volume === undefined) ? 1 : param.volume
      const path = param.name
      const howlerSound = getAudioByPathName(pathPrefix + path, "play", "")
      if (!howlerSound) return
      console.log(howlerSound)
      howlerSound.volume(volume)
      howlerSound.play()
      return {
        debugMsg: `Play sound ${param.name}`,
      }
    }

    else if (commandId === "id_ambient") {
      const path = param.name
      const howlerSound = getAudioByPathName(pathPrefix + path, "play", "")
      if (!howlerSound) return
      let fadeIn = AMBIENT_FADE_IN_TIME
      let fadeOut = AMBIENT_FADE_OUT_TIME
      if (param.abrupt) {
        fadeIn = 0
        fadeOut = 0
      }
      ambientManager.playAmbient(howlerSound, path, fadeIn, fadeOut)

      return {
        debugMsg: `Set ambient audio to: ${path}`,
      }
    }

    else if (commandId === "id_stopAmbient") {
      let fadeOut = AMBIENT_FADE_OUT_TIME
      if (param.abrupt) {
        fadeOut = 0
      }
      ambientManager.stopAmbient(fadeOut)

      return {
        debugMsg: `Stop ambient audio.`,
      }
    }


  }

  // ###########################
  // ###########################
  // special commands end
  // ###########################
  // ###########################

  async function startLoading() {

    let assetText = window.$_assetDefinitions || null

    if (assetText) {
      assetText = assetText.trim()
    }

    let xAssetMap = window._$_xAssetMap || null

    let alternativeEntries = null

    if (xAssetMap) {
      console.log("Asset map found.")
      xAssetMapExistsForErrorDisplay = true
    }
    
    if (assetText) {
      if (xAssetMap) {
        console.log("Asset definitions found, but ignored because asset map takes precedence.")
      } else {
        console.log("Asset definitions found.")
        alternativeEntries = assetText.trim().split('\n')
          .map(n => pathPrefix + n.trim()).filter(Boolean)
      }
    }

    allAssetFileNamesForErrorDisplay = xAssetMap ? Object.keys(xAssetMap) : alternativeEntries

    if (!assetText && !xAssetMap) {
      console.log("No asset map and no asset definitions found. " +
        "Assets won't be preloaded.")
      startApp(null)
      return
    }

    const loadingBar = document.getElementById("loading-bar")

    function updateBar(progress) {
      loadingBar.style.width = (progress * 100) + "%"
    }

    let assets

    try {
      assets = await loadAssets(updateBar, xAssetMap, alternativeEntries)

    } catch(err) {
      console.error("Failed to load assets:", err)
      console.error(`Could not load all assets. Fix "author/assetDefinitions.js" ` +
        `Check console for details.`
      )
    }
    console.log("All assets loaded!")

    startApp(assets)
  }


  window.inch = {
    getState,
    restoreFromState,
    restartStory,
    undo: requestUndo,
    isUndoPossible,
    showSimplePopup,

    story,
  }

  // start app:

  window.onload = startLoading

})(storyContent)
