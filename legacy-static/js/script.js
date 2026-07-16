document.getElementById('year').textContent = new Date().getFullYear();

const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

themeToggle.addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('drp-theme', next);
});

const navToggle = document.getElementById('navToggle');
const mainNav = document.querySelector('.main-nav');

navToggle.addEventListener('click', () => {
  mainNav.classList.toggle('open');
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => mainNav.classList.remove('open'));
});

const favBtn = document.querySelector('.fav-btn');
favBtn.addEventListener('click', () => {
  favBtn.classList.toggle('active');
  favBtn.innerHTML = favBtn.classList.contains('active') ? '&#9829;' : '&#9825;';
});

document.querySelectorAll('.btn-buy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    const name = card.querySelector('h3').textContent;
    alert(`"${name}" checkout isn't connected yet. Hook this button up to your payment processor.`);
  });
});
