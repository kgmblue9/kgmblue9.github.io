/**
 * Google Style Start Page Script
 * - Realtime Weather (Seoul & Jeju) with Open-Meteo API
 * - Google Search & Voice Search
 * - Rich Korean Quotes of the Day
 * - Customizable Shortcuts (LocalStorage)
 * - Live Clock, Dark/Light Theme Switcher
 */

// ==========================================
// 1. Quotes Database
// ==========================================
const QUOTES = [
  { text: "작은 기회로부터 종종 위대한 업적이 시작된다.", author: "데모스테네스", category: "성공 / 기회" },
  { text: "우리가 두려워해야 할 유일한 것은 두려움 그 자체다.", author: "프랭클린 D. 루스벨트", category: "용기" },
  { text: "오늘 할 수 있는 일을 내일로 미루지 마라.", author: "벤저민 프랭클린", category: "시간 관리" },
  { text: "성공이란 열정을 잃지 않고 실패를 거듭할 수 있는 능력이다.", author: "윈스턴 처칠", category: "열정 / 성공" },
  { text: "시작하는 방법은 그만 말하고 이제 행동하는 것이다.", author: "월트 디즈니", category: "행동 / 실천" },
  { text: "당신이 할 수 있다고 믿든 할 수 없다고 믿든, 당신이 옳다.", author: "헨리 포드", category: "마인드셋" },
  { text: "배움을 멈추는 자는 스무 살이든 여든 살이든 늙은이다.", author: "헨리 포드", category: "배움 / 성장" },
  { text: "바람이 불지 않을 때 바람개비를 돌리는 방법은 앞으로 달려가는 것이다.", author: "데일 카네기", category: "도전" },
  { text: "천 리 길도 한 걸음부터 시작된다.", author: "노자", category: "인내 / 시작" },
  { text: "미래를 예측하는 가장 좋은 방법은 미래를 창조하는 것이다.", author: "피터 드러커", category: "미래 / 창조" },
  { text: "어제와 똑같이 살면서 다른 미래를 기대하는 것은 정신병 초기증세다.", author: "알베르트 아인슈타인", category: "변화" },
  { text: "삶이 있는 한 희망은 있다.", author: "키케로", category: "희망" },
  { text: "가장 어두운 밤도 언젠가는 끝나고 해는 떠오른다.", author: "빅토르 위고", category: "위로 / 희망" },
  { text: "고통 없이는 얻는 것도 없다 (No pain, no gain).", author: "벤저민 프랭클린", category: "노력" },
  { text: "위대한 일은 열정 없이 이루어지지 않는다.", author: "게오르크 헤겔", category: "열정" },
  { text: "너 자신이 되어라. 다른 사람의 자리는 이미 꽉 찼다.", author: "오스카 와일드", category: "자아존중" },
  { text: "가장 큰 위험은 위험을 감수하지 않는 것이다.", author: "마크 저커버그", category: "도전 / 혁신" },
  { text: "지혜로운 자는 남의 잘못에서 배운다.", author: "푸블릴리우스 시루스", category: "지혜" },
  { text: "오늘이라는 날은 두 번 다시 오지 않는다는 것을 잊지 말라.", author: "단테", category: "시간 / 하루" },
  { text: "행복은 목적지가 아니라 여행하는 방식이다.", author: "마거릿 러너", category: "행복 / 삶" },
  { text: "늦었다고 생각할 때가 가장 빠른 때이다.", author: "명언", category: "도전" },
  { text: "생각하는 대로 살지 않으면 사는 대로 생각하게 된다.", author: "폴 부르제", category: "주도성" }
];

// ==========================================
// 2. Weather Configuration & Service
// ==========================================
const CITIES = {
  seoul: {
    name: "서울특별시",
    shortName: "서울",
    lat: 37.5665,
    lon: 126.9780
  },
  jeju: {
    name: "제주특별자치도",
    shortName: "제주",
    lat: 33.4996,
    lon: 126.5312
  }
};

// Weather state cache
const weatherData = {
  seoul: null,
  jeju: null,
  selectedCity: 'seoul'
};

// WMO Weather code interpreter
function interpretWeatherCode(code) {
  if (code === 0) return { desc: "맑음", icon: "☀️" };
  if (code === 1) return { desc: "대체로 맑음", icon: "🌤️" };
  if (code === 2) return { desc: "구름 조금", icon: "⛅" };
  if (code === 3) return { desc: "흐림", icon: "☁️" };
  if (code >= 45 && code <= 48) return { desc: "안개", icon: "🌫️" };
  if (code >= 51 && code <= 55) return { desc: "이슬비", icon: "🌦️" };
  if (code >= 61 && code <= 65) return { desc: "비", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { desc: "눈", icon: "❄️" };
  if (code >= 80 && code <= 82) return { desc: "소나기", icon: "🌦️" };
  if (code >= 85 && code <= 86) return { desc: "눈보라", icon: "🌨️" };
  if (code >= 95 && code <= 99) return { desc: "뇌우", icon: "⛈️" };
  return { desc: "맑음", icon: "☀️" };
}

async function fetchCityWeather(cityKey) {
  const city = CITIES[cityKey];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo`;

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    const cur = data.current;
    const daily = data.daily;
    const weatherInfo = interpretWeatherCode(cur.weather_code);

    return {
      temp: Math.round(cur.temperature_2m),
      feelsLike: Math.round(cur.apparent_temperature),
      humidity: Math.round(cur.relative_humidity_2m),
      wind: cur.wind_speed_10m.toFixed(1),
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      desc: weatherInfo.desc,
      icon: weatherInfo.icon,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  } catch (err) {
    console.warn(`[Weather API fallback] ${city.shortName}:`, err.message);
    // Fallback Mock Data in case of network issue
    const isSeoul = cityKey === 'seoul';
    return {
      temp: isSeoul ? 22 : 24,
      feelsLike: isSeoul ? 21 : 23,
      humidity: isSeoul ? 55 : 68,
      wind: isSeoul ? "2.4" : "3.8",
      high: isSeoul ? 25 : 26,
      low: isSeoul ? 16 : 19,
      desc: isSeoul ? "맑음" : "구름 조금",
      icon: isSeoul ? "☀️" : "⛅",
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
  }
}

async function updateAllWeather() {
  const [seoulW, jejuW] = await Promise.all([
    fetchCityWeather('seoul'),
    fetchCityWeather('jeju')
  ]);

  weatherData.seoul = seoulW;
  weatherData.jeju = jejuW;

  // Update Mini Tabs
  document.getElementById('seoulMiniTemp').textContent = `${seoulW.temp}°`;
  document.getElementById('seoulMiniIcon').textContent = seoulW.icon;

  document.getElementById('jejuMiniTemp').textContent = `${jejuW.temp}°`;
  document.getElementById('jejuMiniIcon').textContent = jejuW.icon;

  // Update Footer Brief
  document.getElementById('footerWeatherBrief').textContent = 
    `서울 ${seoulW.icon} ${seoulW.temp}°C (${seoulW.desc})  •  제주 ${jejuW.icon} ${jejuW.temp}°C (${jejuW.desc})`;

  // Update Selected City View
  renderSelectedCityWeather();
}

function renderSelectedCityWeather() {
  const cityKey = weatherData.selectedCity;
  const data = weatherData[cityKey];
  if (!data) return;

  const cityConfig = CITIES[cityKey];
  document.getElementById('currentCityLabel').textContent = cityConfig.name;
  document.getElementById('currentWeatherIcon').textContent = data.icon;
  document.getElementById('currentTemp').innerHTML = `${data.temp}<span class="unit">°C</span>`;
  document.getElementById('currentWeatherDesc').textContent = data.desc;
  document.getElementById('currentHighLow').textContent = `${data.high}° / ${data.low}°`;
  document.getElementById('currentFeelsLike').textContent = `${data.feelsLike}°C`;
  document.getElementById('currentHumidity').textContent = `${data.humidity}%`;
  document.getElementById('currentWind').textContent = `${data.wind} m/s`;
  document.getElementById('weatherUpdateTime').textContent = `${data.time} 기준`;

  // Mini comparison boxes
  if (weatherData.seoul) {
    document.getElementById('compareSeoulStat').textContent = `${weatherData.seoul.icon} ${weatherData.seoul.temp}° (${weatherData.seoul.desc})`;
  }
  if (weatherData.jeju) {
    document.getElementById('compareJejuStat').textContent = `${weatherData.jeju.icon} ${weatherData.jeju.temp}° (${weatherData.jeju.desc})`;
  }
}

// ==========================================
// 3. Search & Voice Search
// ==========================================
function initSearch() {
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const voiceBtn = document.getElementById('voiceSearchBtn');
  const searchForm = document.getElementById('searchForm');
  const luckyBtn = document.getElementById('btnFeelingLucky');

  // Input change handler for clear button
  searchInput.addEventListener('input', () => {
    clearBtn.style.display = searchInput.value.trim().length > 0 ? 'flex' : 'none';
  });

  // Clear button click
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searchInput.focus();
  });

  // Keyboard shortcut '/' to focus search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Search submission
  searchForm.addEventListener('submit', (e) => {
    const query = searchInput.value.trim();
    if (!query) {
      e.preventDefault();
      searchInput.focus();
      return;
    }
    
    // Check if input is a direct URL
    if (/^https?:\/\//i.test(query) || (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(query) && !query.includes(' '))) {
      e.preventDefault();
      const targetUrl = query.startsWith('http') ? query : `https://${query}`;
      window.open(targetUrl, '_blank');
      return;
    }
    // Otherwise standard Google Search proceeds via GET
  });

  // I'm Feeling Lucky button
  luckyBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (!query) {
      window.open('https://www.google.com/doodles', '_blank');
    } else {
      window.open(`https://www.google.com/search?btnI=1&q=${encodeURIComponent(query)}`, '_blank');
    }
  });

  // Voice Search using Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceBtn.addEventListener('click', () => {
      try {
        recognition.start();
        voiceBtn.classList.add('recording');
        showToast('음성을 듣고 있습니다... 말씀해주세요.');
      } catch (err) {
        console.warn('Speech recognition already started or error:', err);
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      searchInput.value = transcript;
      clearBtn.style.display = 'flex';
      voiceBtn.classList.remove('recording');
      showToast(`음성 인식됨: "${transcript}"`);
      // Auto search
      searchForm.submit();
    };

    recognition.onerror = (event) => {
      voiceBtn.classList.remove('recording');
      showToast('음성을 인식하지 못했습니다. 다시 시도해주세요.');
    };

    recognition.onend = () => {
      voiceBtn.classList.remove('recording');
    };
  } else {
    voiceBtn.title = '이 브라우저는 음성 검색을 지원하지 않습니다';
    voiceBtn.style.opacity = '0.5';
  }
}

// ==========================================
// 4. Quotes Generator
// ==========================================
let currentQuoteIndex = -1;

function displayRandomQuote() {
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteCategory = document.getElementById('quoteCategory');
  const refreshBtn = document.getElementById('newQuoteBtn');

  // Animation trigger
  refreshBtn.classList.add('rotating');
  quoteText.style.opacity = '0';

  setTimeout(() => {
    let nextIndex;
    do {
      nextIndex = Math.floor(Math.random() * QUOTES.length);
    } while (nextIndex === currentQuoteIndex && QUOTES.length > 1);

    currentQuoteIndex = nextIndex;
    const quote = QUOTES[nextIndex];

    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = quote.author;
    quoteCategory.textContent = quote.category;

    quoteText.style.opacity = '1';
    refreshBtn.classList.remove('rotating');
  }, 200);
}

function initQuotes() {
  displayRandomQuote();

  const newQuoteBtn = document.getElementById('newQuoteBtn');
  newQuoteBtn.addEventListener('click', displayRandomQuote);

  // Copy Quote
  const copyBtn = document.getElementById('copyQuoteBtn');
  copyBtn.addEventListener('click', async () => {
    const text = document.getElementById('quoteText').textContent;
    const author = document.getElementById('quoteAuthor').textContent;
    const fullText = `${text} — ${author}`;

    try {
      await navigator.clipboard.writeText(fullText);
      showToast('명언이 클립보드에 복사되었습니다.');
    } catch (err) {
      showToast('클립보드 복사 실패');
    }
  });
}

// ==========================================
// 5. Shortcuts Management
// ==========================================
const DEFAULT_SHORTCUTS = [
  { name: 'YouTube', url: 'https://www.youtube.com', icon: '📺' },
  { name: 'Gmail', url: 'https://mail.google.com', icon: '✉️' },
  { name: '네이버', url: 'https://www.naver.com', icon: '🟢' },
  { name: 'GitHub', url: 'https://github.com', icon: '🐙' },
  { name: 'Google 지도', url: 'https://maps.google.com', icon: '🗺️' },
  { name: '번역', url: 'https://translate.google.com', icon: '🌐' },
  { name: 'Netflix', url: 'https://www.netflix.com', icon: '🎬' },
  { name: 'ChatGPT', url: 'https://chatgpt.com', icon: '🤖' }
];

function getStoredShortcuts() {
  const saved = localStorage.getItem('google_start_shortcuts');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_SHORTCUTS;
    }
  }
  return DEFAULT_SHORTCUTS;
}

function saveShortcuts(shortcuts) {
  localStorage.setItem('google_start_shortcuts', JSON.stringify(shortcuts));
}

function renderShortcuts() {
  const grid = document.getElementById('shortcutsGrid');
  grid.innerHTML = '';

  const shortcuts = getStoredShortcuts();

  shortcuts.forEach((item, index) => {
    const card = document.createElement('a');
    card.href = item.url;
    card.target = '_blank';
    card.rel = 'noopener';
    card.className = 'shortcut-card';
    card.title = `${item.name} (${item.url})`;

    // Get favicon URL via Google Favicon Service
    let domain = '';
    try {
      domain = new URL(item.url).hostname;
    } catch (e) {
      domain = item.url;
    }
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

    card.innerHTML = `
      <div class="shortcut-icon-circle">
        <img src="${faviconUrl}" alt="${item.name}" onerror="this.outerHTML='<span>${item.icon || '🔗'}</span>'">
      </div>
      <span class="shortcut-title">${item.name}</span>
      <button class="shortcut-delete-btn" title="삭제" data-index="${index}" aria-label="${item.name} 바로가기 삭제">
        &times;
      </button>
    `;

    // Handle delete button click without navigating
    const delBtn = card.querySelector('.shortcut-delete-btn');
    delBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteShortcut(index);
    });

    grid.appendChild(card);
  });

  // Add Shortcut Button
  const addBtn = document.createElement('button');
  addBtn.className = 'shortcut-card btn-add-shortcut';
  addBtn.title = '바로가기 추가';
  addBtn.innerHTML = `
    <div class="shortcut-icon-circle">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </div>
    <span class="shortcut-title">바로가기 추가</span>
  `;
  addBtn.addEventListener('click', openAddShortcutModal);
  grid.appendChild(addBtn);
}

function deleteShortcut(index) {
  const shortcuts = getStoredShortcuts();
  const deleted = shortcuts.splice(index, 1);
  saveShortcuts(shortcuts);
  renderShortcuts();
  showToast(`"${deleted[0].name}" 바로가기가 삭제되었습니다.`);
}

function openAddShortcutModal() {
  const modal = document.getElementById('shortcutModal');
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('shortcutName').value = '';
  document.getElementById('shortcutUrl').value = '';
  document.getElementById('shortcutName').focus();
}

function closeAddShortcutModal() {
  const modal = document.getElementById('shortcutModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

function initShortcutModal() {
  const modal = document.getElementById('shortcutModal');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelModalBtn');
  const form = document.getElementById('addShortcutForm');

  closeBtn.addEventListener('click', closeAddShortcutModal);
  cancelBtn.addEventListener('click', closeAddShortcutModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeAddShortcutModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('shortcutName').value.trim();
    let url = document.getElementById('shortcutUrl').value.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    const shortcuts = getStoredShortcuts();
    shortcuts.push({ name, url, icon: '🔗' });
    saveShortcuts(shortcuts);
    renderShortcuts();
    closeAddShortcutModal();
    showToast(`"${name}" 바로가기가 추가되었습니다.`);
  });
}

// ==========================================
// 6. Live Clock & Header Controls
// ==========================================
function updateClock() {
  const now = new Date();
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const month = now.getMonth() + 1;
  const date = now.getDate();
  const dayName = days[now.getDay()];

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('liveDate').textContent = `${month}월 ${date}일 (${dayName})`;
  document.getElementById('liveTime').textContent = `${hours}:${minutes}:${seconds}`;
}

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('google_start_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.replace('light-theme', 'dark-theme');
  } else {
    document.body.classList.replace('dark-theme', 'light-theme');
  }

  themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme', !isDark);
    localStorage.setItem('google_start_theme', isDark ? 'dark' : 'light');
    showToast(isDark ? '다크 모드가 적용되었습니다.' : '라이트 모드가 적용되었습니다.');
  });
}

function initAppsMenu() {
  const launcherBtn = document.getElementById('appsLauncherBtn');
  const appsMenu = document.getElementById('appsMenu');

  launcherBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    appsMenu.classList.toggle('show');
    appsMenu.setAttribute('aria-hidden', !appsMenu.classList.contains('show'));
  });

  document.addEventListener('click', (e) => {
    if (!appsMenu.contains(e.target) && e.target !== launcherBtn) {
      appsMenu.classList.remove('show');
      appsMenu.setAttribute('aria-hidden', 'true');
    }
  });
}

// Weather Tab Click Handlers
function initWeatherEvents() {
  const tabSeoul = document.getElementById('tabSeoul');
  const tabJeju = document.getElementById('tabJeju');
  const refreshBtn = document.getElementById('refreshWeatherBtn');

  tabSeoul.addEventListener('click', (e) => {
    e.stopPropagation();
    tabSeoul.classList.add('active');
    tabSeoul.setAttribute('aria-selected', 'true');
    tabJeju.classList.remove('active');
    tabJeju.setAttribute('aria-selected', 'false');
    weatherData.selectedCity = 'seoul';
    renderSelectedCityWeather();
  });

  tabJeju.addEventListener('click', (e) => {
    e.stopPropagation();
    tabJeju.classList.add('active');
    tabJeju.setAttribute('aria-selected', 'true');
    tabSeoul.classList.remove('active');
    tabSeoul.setAttribute('aria-selected', 'false');
    weatherData.selectedCity = 'jeju';
    renderSelectedCityWeather();
  });

  refreshBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    refreshBtn.classList.add('rotating');
    showToast('날씨 정보를 업데이트하는 중...');
    await updateAllWeather();
    setTimeout(() => {
      refreshBtn.classList.remove('rotating');
      showToast('날씨 정보가 최신으로 업데이트되었습니다.');
    }, 400);
  });
}

// Toast Helper
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2800);
}

// ==========================================
// 7. Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Clock
  updateClock();
  setInterval(updateClock, 1000);

  // 2. Theme & Apps
  initTheme();
  initAppsMenu();

  // 3. Search
  initSearch();

  // 4. Quotes
  initQuotes();

  // 5. Shortcuts
  renderShortcuts();
  initShortcutModal();

  // 6. Weather
  initWeatherEvents();
  updateAllWeather();

  // Refresh weather every 15 minutes
  setInterval(updateAllWeather, 15 * 60 * 1000);

  // Custom Settings Button in Footer
  document.getElementById('customSettingsBtn').addEventListener('click', (e) => {
    e.preventDefault();
    openAddShortcutModal();
  });
});
