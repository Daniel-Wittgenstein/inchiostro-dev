
const pathPrefix = window.$_ASSET_PATH_PREFIX

var $_loadAssets = (onProgress = () => {}, assetMap, alternativeEntries) => {

  const LOGGING_ON = true

  const log = (...p) => {
    if (!LOGGING_ON) return
    console.log(...p)
  }

  const base64AssetHandling = $_base64AssetHandling

  const filesToLoad = assetMap ? Object.keys(assetMap) : alternativeEntries

  const assets = {}
  const promises = []
  let loadedCount = 0

  function updateProgress() {
    loadedCount++
    onProgress(loadedCount / filesToLoad.length)
  }

  const loaders = {
    image: (src) => {
      const img = new Image()
      const p = new Promise((resolve, reject) => {
        img.onload = () => { updateProgress(); resolve() }
        img.onerror = reject
        img.src = src
      })
      return [img, p]
    },

    audio: (src) => {
      let sound
      const p = new Promise((resolve, reject) => {
        sound = new Howl({
          src: [src],
          preload: true,
          onload: () => { updateProgress(); resolve() },
          onloaderror: (id, err) => reject(err)
        })
      })
      return [sound, p]
    },

    video: (src) => {
      const video = document.createElement('video')
      const p = new Promise((resolve, reject) => {
        video.onloadeddata = () => { updateProgress(); resolve() }
        video.onerror = reject
        video.src = src
        video.preload = 'auto'
      })
      return [video, p]
    }

  }

  for (const path of filesToLoad) {
    const ext = path.split('.').pop().toLowerCase().trim()

    let src, type

    if (assetMap && assetMap[path]) {
      log(`${path}: preload from asset map`)

      const entry = assetMap[path]
      src = base64AssetHandling.base64ToDataUrl(entry)
      type = entry.type

    } else {

      log(`${path}: preload from path`)

      src = path
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
        type = 'image'
      } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
        type = 'audio'
      } else if (['mp4', 'webm'].includes(ext)) {
        type = 'video'
      }
    }

    if (type && loaders[type]) {
      const [asset, p] = loaders[type](src)
      assets[path] = asset
      promises.push(p)
    }
  }

  return Promise.all(promises).then(() => assets)
}
