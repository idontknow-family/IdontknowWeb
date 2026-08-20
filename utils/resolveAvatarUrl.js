function resolveAvatarUrl(rawUrl) {
  if (!rawUrl) return null;
  const url = rawUrl.trim();
  if (!url) return null;

  if (/github\.com\/.+\/blob\//i.test(url)) {
    const filename = url.split('/').pop().split('?')[0];
    return '/images/' + filename;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  let clean = url.replace(/^\/+/, '');
  if (clean.startsWith('uploads/') || clean.startsWith('images/')) {
    return '/' + clean;
  }

  clean = clean.replace(/^public\//, '');
  if (!clean.startsWith('images/')) {
    clean = 'images/' + clean.replace(/^images\//, '');
  }
  return '/' + clean;
}

module.exports = resolveAvatarUrl;