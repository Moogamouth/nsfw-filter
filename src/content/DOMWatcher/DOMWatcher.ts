// Highly sensitive code, make sure that you know what you're doing
// https://stackoverflow.com/a/39332340/10432429

// @TODO Canvas and SVG
// @TODO Lazy loading for div.style.background-image?
// @TODO <div> and <a>

import { IImageFilter } from '../Filter/ImageFilter'

export type IDOMWatcher = {
  watch: () => void
}

export class DOMWatcher implements IDOMWatcher {
  private readonly observer: MutationObserver
  private readonly imageFilter: IImageFilter

  constructor (imageFilter: IImageFilter) {
    this.imageFilter = imageFilter
    this.observer = new MutationObserver(this.callback.bind(this))
  }

  public watch (): void {
    this.observer.observe(document, DOMWatcher.getConfig())
    this.checkDirectImageLink()
    this.checkDirectVideoLink()
  }

  private callback (mutationsList: MutationRecord[]): void {
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i]
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        this.findAndCheckAllImages(mutation.target as Element)
        this.findAndCheckAllVideos(mutation.target as Element)
      } else if (mutation.type === 'attributes') {
        this.checkAttributeMutation(mutation)
      }
    }
  }

  private findAndCheckAllImages (element: Element): void {
    const images = element.getElementsByTagName('img')
    for (let i = 0; i < images.length; i++) {
      this.imageFilter.analyzeImage(images[i], false)
    }
  }

  private findAndCheckAllVideos (element: Element): void {
    const videos = element.getElementsByTagName('video')
    for (let i = 0; i < videos.length; i++) {
      const source = videos[i].getElementsByTagName('source')[0]
      if (source) {
        videos[i].src = source.src
      }
      videos[i].crossOrigin = 'anonymous'
      this.imageFilter.analyzeVideo(videos[i])
    }
  }

  private checkAttributeMutation (mutation: MutationRecord): void {
    if ((mutation.target as HTMLImageElement).nodeName === 'IMG') {
      this.imageFilter.analyzeImage(mutation.target as HTMLImageElement, mutation.attributeName === 'src')
    } else if ((mutation.target as HTMLVideoElement).nodeName === 'VIDEO') {
      this.imageFilter.analyzeVideo(mutation.target as HTMLVideoElement)
    }
  }

  private checkDirectImageLink (): void {
    const images = document.getElementsByTagName('img')
    if (images.length === 1 && document.body.childElementCount === 1) {
      this.imageFilter.analyzeImage(images[0], true)
      this.imageFilter.analyzeImage(images[0], false)
    }
  }

  private checkDirectVideoLink (): void {
    const videos = document.getElementsByTagName('video')
    if (videos.length === 1 && document.body.childElementCount === 1) {
      const source = videos[0].getElementsByTagName('source')[0]
      if (source) {
        videos[0].src = source.src
      }
      videos[0].crossOrigin = 'anonymous'
      this.imageFilter.analyzeVideo(videos[0])
    }
  }

  private static getConfig (): MutationObserverInit {
    return {
      characterData: false,
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src']
    }
  }
}
