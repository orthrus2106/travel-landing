import './styles/main.scss';

const header = document.querySelector('.header');
const burger = document.querySelector('.header__burger');
const nav = document.querySelector('.header__nav');

if (header && burger && nav) {
  const closeMenu = () => {
    header.classList.remove('header--menu-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isOpen = header.classList.toggle('header--menu-open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  burger.addEventListener('click', toggleMenu);

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    const target = event.target;
    const isMenuOpen = header.classList.contains('header--menu-open');

    if (!isMenuOpen) {
      return;
    }

    if (
      target instanceof Node &&
      (burger.contains(target) || nav.contains(target))
    ) {
      return;
    }

    closeMenu();
  });
}

const y = document.querySelector('[data-year]');
if (y) y.textContent = new Date().getFullYear();

const RSS_URL = 'https://rss.app/feeds/UxVyPO87nsjfrw37.xml';
const FEED_LIMIT = 4;
const FB_GROUP_URL = 'https://www.facebook.com/groups/1767613113355526/?ref=share';

const stripHtml = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const normalizeText = (text) =>
  text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
};

const escapeHtml = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalizeLink = (value) => {
  if (!value) return FB_GROUP_URL;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return FB_GROUP_URL;
};

const removeDuplicateLead = (description, title) => {
  const normalizedDescription = normalizeText(description);
  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle || !normalizedDescription.startsWith(normalizedTitle)) {
    return description;
  }

  const withoutFirstSentence = description
    .replace(/^[^\n.!?]*[\n.!?]\s*/u, '')
    .trim();

  return withoutFirstSentence || description;
};

const formatPubDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

const renderFeedState = (container, message, withLink = false) => {
  const link = withLink
    ? ` <a class="offers__item-link" href="${FB_GROUP_URL}" target="_blank" rel="noopener noreferrer">Открыть группу</a>`
    : '';
  container.innerHTML = `<li class="offers__item offers__item--state">${message}${link}</li>`;
};

const renderFeedItems = (container, items) => {
  container.innerHTML = items
    .map((item) => {
      const title = truncate(stripHtml(item.title || 'Публикация'), 90);
      const cleanDescription = removeDuplicateLead(
        stripHtml(item.description || ''),
        title
      );
      const description = truncate(cleanDescription, 170);
      const date = formatPubDate(item.pubDate);
      const meta = date ? `<p class="offers__item-meta">${escapeHtml(date)}</p>` : '';
      const text = description
        ? `<p class="offers__item-text">${escapeHtml(description)}</p>`
        : '';

      return `
        <li class="offers__item">
          <h3 class="offers__item-title">
            <a class="offers__item-link" href="${item.link}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(title)}
            </a>
          </h3>
          ${meta}
          ${text}
        </li>
      `;
    })
    .join('');
};

const loadOffersFeed = async () => {
  const list = document.querySelector('[data-offers-list]');
  if (!list) return;

  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    if (xmlDoc.querySelector('parsererror')) {
      throw new Error('Invalid RSS XML');
    }

    const seen = new Set();

    const items = Array.from(xmlDoc.querySelectorAll('item'))
      .map((node) => ({
        title: node.querySelector('title')?.textContent?.trim() || '',
        link: normalizeLink(node.querySelector('link')?.textContent?.trim()),
        pubDate: node.querySelector('pubDate')?.textContent?.trim() || '',
        description:
          node.querySelector('description')?.textContent?.trim() ||
          node.querySelector('content\\:encoded')?.textContent?.trim() ||
          '',
      }))
      .filter((item) => item.link)
      .filter((item) => {
        const key = normalizeText(item.title || item.link);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, FEED_LIMIT);

    if (items.length === 0) {
      renderFeedState(list, 'Пока нет публикаций в RSS.', true);
      return;
    }

    renderFeedItems(list, items);
  } catch (error) {
    renderFeedState(list, 'Не удалось загрузить RSS.', true);
  }
};

loadOffersFeed();
