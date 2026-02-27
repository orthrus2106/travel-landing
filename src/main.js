import './styles/main.scss';
import Swiper from 'swiper';
import { A11y, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const galleryAssetModules = import.meta.glob(
  './assets/gallery/**/*.{jpg,jpeg,png,webp}',
  {
    eager: true,
    import: 'default',
  },
);

const RSS_URL = 'https://rss.app/feeds/j4k22ytnU3nz9ALB.xml';
const FEED_LIMIT = 25;
const FEED_PREVIEW_LIMIT = 4;
const FB_GROUP_URL =
  'https://www.facebook.com/groups/1767613113355526/?ref=share';
const isRu =
  document.documentElement.lang.toLowerCase().startsWith('ru') ||
  window.location.pathname.startsWith('/ru/');
const locale = isRu ? 'ru-RU' : 'lv-LV';
const t = {
  galleryAltPrefix: isRu ? 'Галерея LKTA — фото' : 'LKTA galerija — foto',
  openGroup: isRu ? 'Открыть группу' : 'Atvērt grupu',
  feedDefaultTitle: isRu ? 'Публикация' : 'Publikācija',
  feedReadPost: isRu ? 'Читать пост' : 'Lasīt ierakstu',
  feedNoPhoto: isRu ? 'В этом посте нет фото' : 'Šajā ierakstā nav foto',
  feedEmpty: isRu ? 'Пока нет публикаций в RSS.' : 'RSS pagaidām nav publikāciju.',
  feedCollapse: isRu ? 'Свернуть' : 'Rādīt mazāk',
  feedExpand: isRu ? 'Смотреть больше' : 'Skatīt vairāk',
  feedError: isRu ? 'Не удалось загрузить RSS.' : 'Neizdevās ielādēt RSS.',
};
const dateFormatter = new Intl.DateTimeFormat(locale, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});
const htmlParser = new DOMParser();

const initGallerySlider = () => {
  const slider = document.querySelector('[data-gallery-slider]');
  if (!(slider instanceof HTMLElement)) return;
  const track = slider.querySelector('.swiper-wrapper');
  if (!(track instanceof HTMLElement)) return;

  const langFolder = isRu ? '/gallery/ru/' : '/gallery/lv/';

  const galleryUrls = Object.entries(galleryAssetModules)
    .filter(([path]) => path.includes(langFolder))
    .sort(([a], [b]) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    )
    .map(([, url]) => String(url));

  if (galleryUrls.length > 0) {
    track.innerHTML = galleryUrls
      .map(
        (url, index) => `
          <figure class="swiper-slide gallery__slide">
            <img
              class="gallery__img"
              src="${url}"
              alt="${t.galleryAltPrefix} ${index + 1}"
              loading="lazy"
              decoding="async"
            />
          </figure>
        `,
      )
      .join('');
  }

  const section = slider.closest('.gallery');

  new Swiper(slider, {
    modules: [Navigation, Autoplay, A11y],
    slidesPerView: 1,
    spaceBetween: 14,
    speed: 700,
    loop: true,
    grabCursor: true,
    autoplay: {
      delay: 3200,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    navigation: {
      prevEl: section?.querySelector('[data-gallery-prev]') || null,
      nextEl: section?.querySelector('[data-gallery-next]') || null,
    },
    breakpoints: {
      560: {
        slidesPerView: 1.22,
        spaceBetween: 16,
      },
      768: {
        slidesPerView: 1.6,
        spaceBetween: 18,
      },
      1080: {
        slidesPerView: 2.15,
        spaceBetween: 22,
      },
      1400: {
        slidesPerView: 2.3,
        spaceBetween: 24,
      },
    },
  });
};

const initHeaderMenu = () => {
  const header = document.querySelector('.header');
  const burger = document.querySelector('.header__burger');
  const nav = document.querySelector('.header__nav');

  if (!header || !burger || !nav) return;

  const closeMenu = () => {
    header.classList.remove('header--menu-open');
    burger.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isOpen = header.classList.toggle('header--menu-open');
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  burger.addEventListener('click', toggleMenu);
  nav
    .querySelectorAll('a')
    .forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('click', (event) => {
    const target = event.target;
    const isInsideMenu =
      target instanceof Node &&
      (burger.contains(target) || nav.contains(target));

    if (header.classList.contains('header--menu-open') && !isInsideMenu) {
      closeMenu();
    }
  });
};

const setCurrentYear = () => {
  const yearNode = document.querySelector('[data-year]');
  if (yearNode) {
    yearNode.textContent = String(new Date().getFullYear());
  }
};

const stripHtml = (html) => {
  const doc = htmlParser.parseFromString(html, 'text/html');
  return doc.body.textContent?.trim() || '';
};

const extractFirstImageFromHtml = (html) => {
  if (!html) return '';
  const doc = htmlParser.parseFromString(html, 'text/html');
  const img = doc.querySelector('img');
  return normalizeUrl(img?.getAttribute('src')?.trim() || '');
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

const normalizeUrl = (value, fallback = '') => {
  if (!value) return fallback;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return fallback;
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
  return dateFormatter.format(date);
};

const renderFeedState = (container, message, withLink = false) => {
  const link = withLink
    ? ` <a class="offers__item-link" href="${FB_GROUP_URL}" target="_blank" rel="noopener noreferrer">${t.openGroup}</a>`
    : '';
  container.innerHTML = `<li class="offers__item offers__item--state">${message}${link}</li>`;
};

const removeFeedMoreButton = (list) => {
  const parent = list.parentElement;
  if (!parent) return;

  const button = parent.querySelector('[data-offers-more]');
  if (button) button.remove();
};

const renderFeedToggleButton = (list, label, onClick) => {
  const parent = list.parentElement;
  if (!parent) return;

  let button = parent.querySelector('[data-offers-more]');
  if (!(button instanceof HTMLButtonElement)) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--ghost';
    button.setAttribute('data-offers-more', 'true');
    parent.append(button);
  }

  button.textContent = label;
  button.onclick = onClick;
};

const renderFeedItems = (container, items) => {
  container.innerHTML = items
    .map((item) => {
      const title = truncate(stripHtml(item.title || t.feedDefaultTitle), 90);
      const cleanDescription = removeDuplicateLead(
        stripHtml(item.description || ''),
        title,
      );
      const description = truncate(cleanDescription, 170);
      const date = formatPubDate(item.pubDate);
      const meta = date
        ? `<p class="offers__item-meta">${escapeHtml(date)}</p>`
        : '';
      const text = description
        ? `<p class="offers__item-text">${escapeHtml(description)}</p>`
        : '';
      const image = item.image
        ? `
          <figure class="offers__item-media">
            <img class="offers__item-img" src="${item.image}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" />
          </figure>
        `
        : `
          <figure class="offers__item-media offers__item-media--placeholder" aria-hidden="true">
            <span class="offers__item-media-label">Facebook</span>
            <p class="offers__item-media-text">${t.feedNoPhoto}</p>
          </figure>
        `;

      return `
        <li class="offers__item">
          ${image}
          <div class="offers__item-body">
            <div class="offers__item-head">
              <span class="offers__item-source">Facebook</span>
              ${meta}
            </div>
            <h3 class="offers__item-title">${escapeHtml(title)}</h3>
            ${text}
          </div>
          <a class="offers__item-cta" href="${item.link}" target="_blank" rel="noopener noreferrer">${t.feedReadPost}</a>
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
    const xmlDoc = htmlParser.parseFromString(xmlText, 'application/xml');

    if (xmlDoc.querySelector('parsererror')) {
      throw new Error('Invalid RSS XML');
    }

    const seen = new Set();

    const items = Array.from(xmlDoc.querySelectorAll('item'))
      .map((node) => {
        const descriptionRaw =
          node.querySelector('description')?.textContent?.trim() ||
          node.querySelector('content\\:encoded')?.textContent?.trim() ||
          '';

        const mediaImage =
          node.querySelector('media\\:content')?.getAttribute('url')?.trim() ||
          node
            .querySelector('media\\:thumbnail')
            ?.getAttribute('url')
            ?.trim() ||
          node.querySelector('enclosure')?.getAttribute('url')?.trim() ||
          '';

        return {
          title: node.querySelector('title')?.textContent?.trim() || '',
          link: normalizeUrl(
            node.querySelector('link')?.textContent?.trim(),
            FB_GROUP_URL,
          ),
          pubDate: node.querySelector('pubDate')?.textContent?.trim() || '',
          description: descriptionRaw,
          image: normalizeUrl(
            mediaImage || extractFirstImageFromHtml(descriptionRaw),
          ),
        };
      })
      .filter((item) => item.link)
      .filter((item) => {
        const key = normalizeText(item.title || item.link);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, FEED_LIMIT);

    if (items.length === 0) {
      removeFeedMoreButton(list);
      renderFeedState(list, t.feedEmpty, true);
      return;
    }

    let isExpanded = false;
    const renderVisibleItems = () => {
      const visibleItems = isExpanded
        ? items
        : items.slice(0, FEED_PREVIEW_LIMIT);
      renderFeedItems(list, visibleItems);

      if (items.length > FEED_PREVIEW_LIMIT) {
        renderFeedToggleButton(
          list,
          isExpanded ? t.feedCollapse : t.feedExpand,
          () => {
            isExpanded = !isExpanded;
            renderVisibleItems();
          },
        );
        return;
      }

      removeFeedMoreButton(list);
    };

    renderVisibleItems();
  } catch {
    removeFeedMoreButton(list);
    renderFeedState(list, t.feedError, true);
  }
};

initHeaderMenu();
initGallerySlider();
setCurrentYear();
loadOffersFeed();
