document.addEventListener("DOMContentLoaded", function () {
  const fallback = document.body.dataset.fallback;
  const customSchemeUrl = document.body.dataset.scheme;

  let hidden = false;

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      hidden = true;
    }
  });

  // Coba buka app langsung
  window.location.href = customSchemeUrl;

  // Fallback ke App Store jika tidak keluar dari halaman
  setTimeout(() => {
    if (!hidden) {
      window.location.href = fallback;
    }
  }, 2000);
});
