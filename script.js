const revealElements = document.querySelectorAll(
  '.solution-grid article, .inventory-card, .service-list div, .contact, .hero-card, .category-card, .brand-card, .deal-card'
);

revealElements.forEach((el) => el.classList.add('fade-up'));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealElements.forEach((el) => observer.observe(el));

const scrollButtons = document.querySelectorAll('[data-scroll]');
scrollButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-scroll');
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

const leadForm = document.getElementById('lead-form');
const toast = document.getElementById('toast');

if (leadForm && toast) {
  leadForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    const entry = {
      fullName: formData.get('fullName')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      requirements: formData.get('requirements')?.toString().trim(),
      createdAt: new Date().toISOString(),
    };

    if (!entry.fullName || !entry.email || !entry.requirements) {
      toast.textContent = 'Please complete the required fields.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2400);
      return;
    }

    const stored = JSON.parse(localStorage.getItem('lead_requests') || '[]');
    stored.unshift(entry);
    localStorage.setItem('lead_requests', JSON.stringify(stored.slice(0, 50)));

    leadForm.reset();
    toast.textContent = 'Thanks! Your request has been captured.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  });
}

const homeCatalog = document.getElementById('homeCatalog');
if (homeCatalog) {
  homeCatalog.innerHTML = '<p class="form-note">Loading catalog items...</p>';
  fetch(`/api/items?ts=${Date.now()}`, { cache: 'no-store' })
    .then((res) => res.json())
    .then((items) => {
      if (!Array.isArray(items) || !items.length) {
        homeCatalog.innerHTML = '<p class="form-note">No catalog items yet. Add some from the admin panel.</p>';
        return;
      }
      homeCatalog.innerHTML = items
        .slice(0, 6)
        .map(
          (item) => `
          <article class="inventory-card">
            <img src="${item.image}" alt="${item.name}" />
            <span>${item.condition}</span>
            <h3>${item.name}</h3>
            <p>${item.spec}</p>
            <a class="ghost-btn" href="catalog.html">View Details</a>
          </article>
        `
        )
        .join('');
    })
    .catch(() => {
      homeCatalog.innerHTML = '<p class="form-note">Unable to load catalog items.</p>';
    });
}
