import availableImages from 'virtual:event-images';

/**
 * Keep the designed placeholder until a known local image loads successfully.
 * Missing paths are never requested. Adding files refreshes the Vite manifest.
 */
export function mountEventImages(container, paths = availableImages) {
  const available = new Set(paths);
  for (const area of container.querySelectorAll('.event-media')) {
    const path = area.dataset.image;
    if (!available.has(path)) continue;
    const image = new Image();
    image.className = 'event-image';
    image.alt = `${area.dataset.title} event illustration`;
    image.decoding = 'async';
    image.addEventListener('load', () => {
      area.querySelector('.image-placeholder').hidden = true;
      area.append(image);
    }, { once: true });
    // If a supplied file cannot decode, retain the placeholder without a broken image element.
    image.src = `${import.meta.env.BASE_URL}${path.slice(1)}`;
  }
}
