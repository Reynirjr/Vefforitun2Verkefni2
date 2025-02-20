document.addEventListener('DOMContentLoaded', () => {
  const gun = document.querySelector('.gun');
  const links = document.querySelectorAll('.index-list a');
  const pageHeader = document.querySelector('header');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      link.classList.add('drop-down');
      gun.classList.add('rotate');
      document.body.classList.add('bg-flash');
      pageHeader.classList.add('bg-flash');

      link.addEventListener('animationend', () => {
        window.location.href = link.href;
      }, { once: true });

      setTimeout(() => {
        gun.classList.remove('rotate');
        document.body.classList.remove('bg-flash');
        pageHeader.classList.remove('bg-flash');
      }, 200);
    });
  });
});
