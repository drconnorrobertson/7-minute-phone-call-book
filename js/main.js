// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('active');
      toggle.setAttribute('aria-expanded', links.classList.contains('active'));
    });
    // Close on link click
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        links.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Scroll animations
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.step-card, .testimonial-card, .feature-card, .chapter-item, .blog-card, .script-card, .timeline-item').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Active nav link
  var path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href && path.indexOf(href.replace(/\/index\.html$/, '').replace(/\/$/, '')) > -1 && href !== '/') {
      a.classList.add('active');
    }
  });
});

// Animate in class
document.head.insertAdjacentHTML('beforeend', '<style>.animate-in{opacity:1!important;transform:translateY(0)!important}</style>');

// Smooth scroll for anchor links
document.addEventListener('click', function (e) {
  var target = e.target.closest('a[href^="#"]');
  if (target) {
    var el = document.querySelector(target.getAttribute('href'));
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
});
