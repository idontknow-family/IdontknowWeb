// Normalizes any avatarUrl value stored in DB into a browser-loadable path.
// Handles: GitHub "blob" page links, bare filenames, "public/images/x.png",
// "images/x.png", already-correct "/images/x.png", and full external URLs
// (Discord CDN, imgur, raw.githubusercontent.com, etc.) unchanged.
function resolveAvatarUrl(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;

  // GitHub "blob" viewer link is an HTML page, not an image -> rewrite
  if (/github\.com\/.+\/blob\//i.test(url)) {
    const filename = url.split('/').pop().split('?')[0];
    return '/images/' + filename;
  }

  // Any other full URL (raw.githubusercontent.com, Discord CDN, imgur...) -> keep as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Relative path variants -> normalize to "/images/<filename>"
  let clean = url.replace(/^\/+/, '').replace(/^public\//, '');
  if (!clean.startsWith('images/')) {
    clean = 'images/' + clean.replace(/^images\//, '');
  }
  return '/' + clean;
}

module.exports = resolveAvatarUrl;