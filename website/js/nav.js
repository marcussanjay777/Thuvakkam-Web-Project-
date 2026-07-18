// Mobile navigation: injects a hamburger toggle and shows/hides the nav links.
// Included on every public website page. Desktop is unaffected (button hidden by CSS).
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var inner = document.querySelector('.nav-inner');
    var links = document.querySelector('.nav-links');
    if (!inner || !links) return;

    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<i class="ti ti-menu-2"></i>';

    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.innerHTML = open ? '<i class="ti ti-x"></i>' : '<i class="ti ti-menu-2"></i>';
    });

    // Close the menu after tapping a link
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.innerHTML = '<i class="ti ti-menu-2"></i>';
      }
    });

    inner.appendChild(btn);
  });
})();
