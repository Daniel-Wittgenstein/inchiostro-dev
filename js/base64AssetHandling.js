
var $_base64AssetHandling = (function() {

  function base64ToDataUrl(asset) {
    let ext = asset.ext
    if (asset === "svg") {
      ext = "svg+xml"
    }
    return `data:${asset.type}/${ext};base64,${asset.value}`
  }

  return ({
    base64ToDataUrl,
  })

})()