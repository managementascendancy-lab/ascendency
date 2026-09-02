// Hero artwork ships as 3 WebP widths (see scripts/optimize-images.js):
// <name>-300.webp, <name>-600.webp, <name>.webp (1000w, the default src).
// This turns a hero's default image path into the matching srcSet string.
export function heroSrcSet(image) {
  const base = image.replace(/\.webp$/, "");
  return `${base}-300.webp 300w, ${base}-600.webp 600w, ${image} 1000w`;
}

// The -300/-600/full tiers above are all the same whole-body square
// composition, just smaller — fine down to card size, but at very small
// (~48px) avatar sizes the face becomes illegible and only the bright
// power-effect glow reads, which looks like the character got cropped.
// <name>-avatar.webp is a separate tight headshot crop generated for that
// use case specifically (see AVATAR_* in scripts/optimize-images.js).
export function heroAvatarSrc(image) {
  return `${image.replace(/\.webp$/, "")}-avatar.webp`;
}
