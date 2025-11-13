
const pathPrefix = "assets/"

var $_loadAssets = (assetListText, onProgress = () => {}, assetMap) => {

  const base64AssetHandling = $_base64AssetHandling

  const lines = assetListText.trim().split('\n').map(n => n.trim()).filter(Boolean)
  const assets = {}
  const promises = []
  let loadedCount = 0

  function updateProgress() {
    loadedCount++
    onProgress(loadedCount / lines.length)
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

  window.aaa = assetMap

  for (const line of lines) {
    const [id, path] = line.split(':').map(s => s.trim())
    const ext = path.split('.').pop().toLowerCase().trim()
    const fullPath = pathPrefix + path

    let src, type
    if (assetMap && assetMap[fullPath]) {
      const entry = assetMap[fullPath]
      src = base64AssetHandling.base64ToDataUrl(entry)
      type = entry.type
    } else {

      if (assetMap) {
        console.warn(`asset map exists but does not include all specified assets. `+
          `Trying to load ${id}: ${fullPath} from disk, instead.`
        )
      }

      src = fullPath
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
      assets[id] = asset
      promises.push(p)
    }
  }

  return Promise.all(promises).then(() => assets)
}
