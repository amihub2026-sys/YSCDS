(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Mobile navigation
  const header = q('.site-header');
  const menuToggle = q('#menuToggle');
  const mobileMenu = q('#mobileMenu');
  function closeMenu() {
    mobileMenu.classList.remove('is-open');
    header.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
    mobileMenu.setAttribute('inert', '');
    document.body.style.overflow = '';
  }
  function openMenu() {
    mobileMenu.classList.add('is-open');
    header.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuToggle.setAttribute('aria-label', 'Close menu');
    mobileMenu.removeAttribute('inert');
    document.body.style.overflow = 'hidden';
  }
  menuToggle.addEventListener('click', () => mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu());
  qa('a', mobileMenu).forEach(a => a.addEventListener('click', closeMenu));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', () => { if (window.innerWidth > 1040 && mobileMenu.classList.contains('is-open')) closeMenu(); });
  document.addEventListener('click', e => {
    if (mobileMenu.classList.contains('is-open') && !header.contains(e.target)) closeMenu();
  });

  // Scroll-based header and progress bar, throttled with rAF
  let scrollWaiting = false;
  function updateScroll() {
    header.classList.toggle('scrolled', window.scrollY > 30);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    q('#scrollProgress').style.width = (max ? (window.scrollY / max) * 100 : 0) + '%';
    scrollWaiting = false;
  }
  window.addEventListener('scroll', () => { if (!scrollWaiting) { scrollWaiting = true; window.requestAnimationFrame(updateScroll); } }, { passive: true });
  updateScroll();
  if (window.IntersectionObserver) {
    const sections = qa('main section[id]');
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          qa('.desktop-nav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        }
      });
    }, { rootMargin: '-24% 0px -55% 0px', threshold: 0 });
    sections.forEach(section => navObserver.observe(section));
  }

  // Hero: show real images; short text does not obscure performances
  const slides = [
    { eyebrow: 'YOUTH • CULTURE • HERITAGE', h1: 'Tradition <br>in <em>Motion.</em>', subtitle: 'Young hands. Living traditions.', action: 'Explore Events', href: '#events' },
    { eyebrow: 'CLASSICAL DANCE • YOUNG TALENT', h1: 'Culture <br>in <em>Colour.</em>', subtitle: 'The next generation takes the stage.', action: 'View Dance Photos', href: '#gallery', category: 'Dance' },
    { eyebrow: 'TRADITIONAL MUSIC • CELEBRATION', h1: 'Rhythms <br>of <em>Heritage.</em>', subtitle: 'Sounds that bring communities together.', action: 'Explore Music', href: '#gallery', category: 'Music' },
    { eyebrow: 'SILAMBAM • STUDENT PARTICIPATION', h1: 'Together <br>we <em>Grow.</em>', subtitle: 'One tradition. Many young hands.', action: 'See Silambam Photos', href: '#gallery', category: 'Silambam' }
  ];
  const heroImages = qa('.hero-image');
  const heroDots = qa('#heroIndicators button');
  const heroCopy = q('#heroCopy');
  let heroIndex = 0, heroTimer;
  function selectHero(index) {
    heroIndex = (index + slides.length) % slides.length;
    heroImages.forEach((image, i) => image.classList.toggle('is-active', i === heroIndex));
    heroDots.forEach((button, i) => {
      button.classList.toggle('selected', i === heroIndex);
      if (i === heroIndex) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
    const item = slides[heroIndex];
    heroCopy.classList.add('changing');
    window.setTimeout(() => {
      q('.hero-eyebrow', heroCopy).innerHTML = '<span class="eyebrow-line"></span> ' + item.eyebrow;
      q('h1', heroCopy).innerHTML = item.h1;
      q('p', heroCopy).textContent = item.subtitle;
      const link = q('a', heroCopy);
      link.href = item.href;
      link.innerHTML = item.action + ' <span aria-hidden="true">↗</span>';
      if (item.category) link.dataset.galleryLink = item.category; else delete link.dataset.galleryLink;
      heroCopy.classList.remove('changing');
    }, reduceMotion ? 0 : 150);
  }
  function restartHero() {
    window.clearInterval(heroTimer);
    if (!reduceMotion && document.visibilityState === 'visible') heroTimer = window.setInterval(() => selectHero(heroIndex + 1), 6000);
  }
  q('.hero-prev').addEventListener('click', () => { selectHero(heroIndex - 1); restartHero(); });
  q('.hero-next').addEventListener('click', () => { selectHero(heroIndex + 1); restartHero(); });
  heroDots.forEach((button, i) => button.addEventListener('click', () => { selectHero(i); restartHero(); }));
  const hero = q('.hero');
  let touchStart = null;
  hero.addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; }, { passive: true });
  hero.addEventListener('touchend', e => { if (touchStart === null) return; const delta = e.changedTouches[0].clientX - touchStart; if (Math.abs(delta) > 60) { selectHero(heroIndex + (delta < 0 ? 1 : -1)); restartHero(); } touchStart = null; }, { passive: true });
  document.addEventListener('visibilitychange', restartHero);
  restartHero();

  // Horizontal events rail
  const eventScroll = q('#eventScroll');
  for (const [id, direction] of [['eventPrev', -1], ['eventNext', 1]]) {
    q('#' + id).addEventListener('click', () => eventScroll.scrollBy({ left: direction * Math.max(260, eventScroll.clientWidth * .72), behavior: reduceMotion ? 'instant' : 'smooth' }));
  }

  // One consistent photo archive using the supplied photography only
  const folder = 'assets/images/events/';
  const photos = [
    ['silambam-students-in-action', 'Student Silambam practice', 'Silambam', 'Participants practicing with staffs at an outdoor gathering'],
    ['classical-dance-stage', 'Young classical performers', 'Dance', 'Students performing in colourful traditional costumes'],
    ['traditional-nadaswaram-ensemble', 'Nadaswaram ensemble', 'Music', 'Musicians performing on traditional wind instruments'],
    ['silambam-aerial-gathering', 'A gathering in motion', 'Silambam', 'Aerial view of a large-scale group demonstration'],
    ['family-award-recognition', 'A proud certificate moment', 'Awards', 'A family displaying recognition certificates and a trophy'],
    ['classical-dance-group', 'Traditional dance portraits', 'Dance', 'Young dancers presenting coordinated classical poses'],
    
['classical-dance-group2.jpg', 'Traditional Dance Performance', 'Dance', 'Young dancers presenting coordinated classical poses'],

    ['community-recognition-stage', 'Stage recognition', 'Awards', 'Participants at a cultural recognition event'],
    ['decorative-cultural-procession', 'A vibrant cultural procession', 'Events', 'Students with colourful decorations in a public procession'],
    ['folk-tiger-costumes', 'Folk performance characters', 'Events', 'Performers in tiger-inspired folk costumes'],
    ['silambam-student-drill', 'Focus and discipline', 'Silambam', 'Young Silambam students practicing with staffs'],
    ['folk-percussion-festival', 'Folk percussion event', 'Music', 'Outdoor performance with folk percussion instruments'],
    ['college-recognition-event', 'College gathering', 'Awards', 'Recognition-related programme on a college stage'],
    ['students-percussion-training', 'The next rhythm', 'Music', 'Students with drums during a training session'],
    ['folk1.jpg', 'Karakattam', 'Music', 'Musicians performing on traditional wind instruments'],
    ['folk2.jpg', 'Traditional Folk Drummers', 'Music', 'Musicians performing on traditional wind instruments'],
    ['folk3.jpg', 'Cultural Performance', 'Events', 'Musicians performing on traditional wind instruments'],
    ['folk4.jpg', 'Youth Folk Arts Performance', 'Events', 'Musicians performing on traditional wind instruments'],
        ['event1.jpg', 'Traditional Folk Face Art', 'Events', 'Colourful facial makeup representing Tamil folk traditions'],
    ['event2.jpg', 'Behind the Folk Performance', 'Events', 'An artist preparing traditional makeup before a cultural performance.'],
    ['event3.jpg', 'Traditional Folk Deity Performance', 'Events', 'A performer portraying a traditional deity-inspired character with expressive makeup.'],

    ['silambam-aerial-performance', 'Aerial Silambam formation', 'Silambam', 'Participants arranged across an outdoor demonstration space'],
    ['cultural-programme-group', 'Cultural programme team', 'Events', 'Performers and organisers gathered for a group photograph'],
    ['folk-stage-celebration', 'Folk stage celebration', 'Events', 'Traditional performing artists gathered on a decorated stage'],
    ['sports-event-volunteers', 'People behind the event', 'Events', 'Event representatives seated at a venue'],
    ['community-awards', 'Trophies and celebrations', 'Awards', 'Awards displayed at a community event venue'],
     ['award1.jpg', 'Trophies and celebrations', 'Awards', 'Awards displayed at a community event venue'],
      ['award2.jpg', 'Trophies and celebrations', 'Awards', 'Awards displayed at a community event venue'],
    ['silambam-cultural-movement', 'Silambam and movement', 'Silambam', 'Students demonstrating traditional skills during a cultural programme'],
    ['community-portrait-one', 'Community portrait 01', 'People', 'Portrait provided in the YSCDS collection; name and role pending confirmation'],
    ['community-portrait-two', 'Community portrait 02', 'People', 'Portrait provided in the YSCDS collection; name and role pending confirmation']
      

].map(([id, title, category, description]) => ({
  id,
  title,
  category,
  description,
  src: folder + (
    /\.(jpg|jpeg|png|webp)$/i.test(id)
      ? id
      : id + '.webp'
  )
}));

  // Auto-rotating featured gallery photo; synchronized with current filter/search.
  let featuredIndex = 0;
  let featuredTimer = null;
  let featuredPaused = reduceMotion;
  const featuredImage = q('#featuredImage');
  function updateFeatured() {
    const item = visibleGallery[featuredIndex % Math.max(visibleGallery.length, 1)];
    q('#galleryFeatured').hidden = !item;
    if (!item) return;
    featuredImage.src = item.src;
    featuredImage.alt = item.description;
    q('#featuredTitle').textContent = item.title;
    q('#featuredCategory').textContent = item.category.toUpperCase();
    q('#featuredIndex').textContent = String((featuredIndex % visibleGallery.length) + 1).padStart(2, '0') + ' / ' + String(visibleGallery.length).padStart(2, '0');
    q('#featuredOpen').setAttribute('aria-label', 'Open featured photo: ' + item.title);
  }
  function shiftFeatured(by) { if (!visibleGallery.length) return; featuredIndex = (featuredIndex + by + visibleGallery.length) % visibleGallery.length; updateFeatured(); }
  function startFeatured() {
    window.clearInterval(featuredTimer);
    if (!featuredPaused && document.visibilityState === 'visible') featuredTimer = window.setInterval(() => shiftFeatured(1), 5500);
  }
  q('#featuredPrev').addEventListener('click', () => { shiftFeatured(-1); startFeatured(); });
  q('#featuredNext').addEventListener('click', () => { shiftFeatured(1); startFeatured(); });
  q('#featuredPause').addEventListener('click', e => { featuredPaused = !featuredPaused; e.currentTarget.textContent = featuredPaused ? '▶' : 'Ⅱ'; e.currentTarget.setAttribute('aria-label', featuredPaused ? 'Play featured gallery' : 'Pause featured gallery'); startFeatured(); });
  q('#featuredOpen').addEventListener('click', () => { if (visibleGallery.length) openPhoto(visibleGallery[featuredIndex].id); });
  document.addEventListener('visibilitychange', startFeatured);

  const galleryGrid = q('#galleryGrid');
  const galleryButtons = qa('#galleryFilters button');
  const galleryCount = q('#galleryCount');
  const showMore = q('#showMoreGallery');
  let activeFilter = 'All', currentSearch = '', expanded = false, visibleGallery = [], currentLightboxIndex = 0;
  function renderGallery() {
    const list = photos.filter(p => (activeFilter === 'All' || p.category === activeFilter) && (p.title + ' ' + p.category + ' ' + p.description).toLowerCase().includes(currentSearch));
    visibleGallery = list;
    featuredIndex = 0;
    updateFeatured();
    startFeatured();
    galleryCount.textContent = 'Showing ' + (expanded ? list.length : Math.min(8, list.length)) + ' of ' + list.length + ' photos';
    galleryGrid.replaceChildren();
    const shown = expanded ? list : list.slice(0, 8);
    for (let i = 0; i < shown.length; i++) {
      const p = shown[i];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-tile';
      button.setAttribute('aria-label', 'View photo: ' + p.title);
      const photo = document.createElement('img');
      photo.src = p.src;
      photo.alt = p.description;
      photo.loading = 'lazy';
      photo.decoding = 'async';
      const label = document.createElement('span');
      label.className = 'gallery-label';
      const category = document.createElement('small');
      category.textContent = p.category;
      const title = document.createElement('b');
      title.textContent = p.title;
      label.append(category, title);
      const expand = document.createElement('span');
      expand.className = 'gallery-expand';
      expand.setAttribute('aria-hidden', 'true');
      expand.textContent = '↗';
      button.append(photo, label, expand);
      button.addEventListener('click', () => openPhoto(p.id));
      galleryGrid.append(button);
    }
    if (!list.length) {
      const empty = document.createElement('p'); empty.className = 'gallery-empty'; empty.textContent = 'No matching photos. Try a different filter or search.'; galleryGrid.append(empty);
    }
    showMore.hidden = expanded || list.length <= 8;
  }
  function setGalleryFilter(category) {
    activeFilter = category; expanded = false;
    galleryButtons.forEach(b => { const selected = b.dataset.filter === category; b.classList.toggle('active', selected); b.setAttribute('aria-pressed', String(selected)); });
    renderGallery();
  }
  galleryButtons.forEach(btn => btn.addEventListener('click', () => setGalleryFilter(btn.dataset.filter)));
  q('#gallerySearch').addEventListener('input', event => { currentSearch = event.target.value.toLowerCase().trim(); expanded = false; renderGallery(); });
  showMore.addEventListener('click', () => { expanded = true; renderGallery(); });
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-gallery-link]');
    if (link) {
      setGalleryFilter(link.dataset.galleryLink);
      currentSearch = ''; q('#gallerySearch').value = '';
      renderGallery();
    }
  });
  renderGallery();

  // Book of World Records: show poster first, then navigate only after closing.
  const recordDialog = q('#recordPosterDialog');
  const recordClose = q('#recordPosterClose');
  const recordTarget = q('#world-records');

  qa('a[href="#world-records"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      if (mobileMenu.classList.contains('is-open')) closeMenu();
      if (!recordDialog.open) recordDialog.showModal();
    });
  });

  recordClose.addEventListener('click', () => recordDialog.close());
  // If dismissed with Escape or by tapping outside, still continue to the section.
  recordDialog.addEventListener('click', event => { if (event.target === recordDialog) recordDialog.close(); });
  recordDialog.addEventListener('close', () => {
    history.replaceState(null, '', '#world-records');
    window.requestAnimationFrame(() => recordTarget.scrollIntoView({ behavior: reduceMotion ? 'instant' : 'smooth', block: 'start' }));
  });

  // Photo viewer - accepts any provided photo including achievements
  const imageDialog = q('#imageDialog');
  const lightboxImage = q('#lightboxImage');
  function openPhoto(id) {
    const photo = photos.find(p => p.id === id);
    if (!photo) return;
    if (!visibleGallery.some(p => p.id === photo.id)) visibleGallery = photos;
    currentLightboxIndex = Math.max(0, visibleGallery.findIndex(p => p.id === id));
    displayLightbox(photo);
    if (!imageDialog.open) imageDialog.showModal();
  }
  function displayLightbox(photo) {
    lightboxImage.src = photo.src;
    lightboxImage.alt = photo.description;
    q('#lightboxTitle').textContent = photo.title;
    q('#lightboxCaption').textContent = photo.description;
  }
  function moveLightbox(step) {
    if (!visibleGallery.length) return;
    currentLightboxIndex = (currentLightboxIndex + step + visibleGallery.length) % visibleGallery.length;
    displayLightbox(visibleGallery[currentLightboxIndex]);
  }
  qa('[data-open-image]').forEach(btn => btn.addEventListener('click', () => { const chosen = photos.find(p => p.id === btn.dataset.openImage); if (!chosen) return; visibleGallery = photos.filter(p => p.category === chosen.category); openPhoto(chosen.id); }));
  q('#lightboxPrev').addEventListener('click', () => moveLightbox(-1));
  q('#lightboxNext').addEventListener('click', () => moveLightbox(1));
  q('#lightboxClose').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('click', e => { if (e.target === imageDialog) imageDialog.close(); });
  imageDialog.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') moveLightbox(-1); if (e.key === 'ArrowRight') moveLightbox(1); });

  // Published PDFs are hosted as static files. No browser-side uploads.
  const resultsNode = q('#resultsList');
  const files = Array.isArray(window.YSCDS_PDF_RESULTS) ? window.YSCDS_PDF_RESULTS : [];
  const safePdfPath = /^assets\/records\/files\/[A-Za-z0-9 _().-]+\.pdf$/i;
  if (files.length) {
    resultsNode.replaceChildren();
    for (const result of files) {
      if (!result || typeof result.title !== 'string' || typeof result.file !== 'string' || !safePdfPath.test(result.file)) continue;
      const row = document.createElement('div'); row.className = 'published-result';
      const icon = document.createElement('span'); icon.className = 'pdf-icon'; icon.textContent = 'PDF';
      const body = document.createElement('div'); body.className = 'result-meta';
      const title = document.createElement('b'); title.textContent = result.title;
      const details = document.createElement('small'); details.textContent = [result.category, result.year].filter(Boolean).join(' · ');
      body.append(title, details);
      const actions = document.createElement('span'); actions.className = 'result-actions';
      const view = document.createElement('a'); view.href = result.file; view.target = '_blank'; view.rel = 'noopener noreferrer'; view.textContent = 'View ↗'; view.setAttribute('aria-label', 'View ' + result.title + ' PDF');
      const download = document.createElement('a'); download.href = result.file; download.download = ''; download.textContent = 'Download ↓'; download.setAttribute('aria-label', 'Download ' + result.title + ' PDF');
      actions.append(view, download);
      row.append(icon, body, actions); resultsNode.append(row);
    }
    if (!resultsNode.children.length) resultsNode.innerHTML = '<div class="result-empty"><h3>PDF results will appear here</h3><p>No valid published PDFs have been added.</p></div>';
  }

  q('#currentYear').textContent = new Date().getFullYear();
})();
