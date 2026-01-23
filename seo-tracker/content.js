(() => {
  const getSEOData = () => {
    const title = document.title
    const metaDesc =
      document.querySelector("meta[name='description']")?.content || ""

    const headings = {}
    for (let i = 1; i <= 6; i++) {
      headings[`h${i}`] = document.querySelectorAll(`h${i}`).length
    }

    const images = [...document.images]
    const imagesWithoutAlt = images.filter(img => !img.alt)

    const text = document.body.innerText || ""
    const wordCount = text.trim().split(/\s+/).length

    return {
      title,
      metaDesc,
      headings,
      images: images.length,
      imagesWithoutAlt: imagesWithoutAlt.length,
      wordCount
    }
  }

  chrome.runtime.onMessage.addListener((req, _, sendResponse) => {
    if (req.type === "GET_SEO_DATA") {
      sendResponse(getSEOData())
    }
  })
})()
