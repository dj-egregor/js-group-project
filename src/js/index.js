const axios = require('axios').default;
const API_KEY = '31449444226ba6345698313fe055564a';
const LANGUAGE = 'ru';
//https://api.themoviedb.org/3/configuration/languages?api_key=31449444226ba6345698313fe055564a

import noImg from '../images/no-image.jpg';

let genres = [];
let totalPages = 0;
let currentPage = 1;
let pageLinks = 5; // нечетные
const paginationRange = Math.floor(pageLinks / 2);
let startPaginationPage = 1;
let stopPaginationPage = pageLinks;

const movieContainer = document.querySelector('.js-movies-container');
const pagination = document.querySelector('.js-paginator');
const searchMovieInput = document.querySelector('.js-search-form__input');
const searchForm = document.querySelector('.js-search-form');
const backdrop = document.querySelector('.backdrop');
const libraryButtonsBlock = document.querySelector('.js-library-buttons-block');
const buttonLibraryWatched = document.querySelector('.js-watched');
const buttonLibraryQueue = document.querySelector('.js-queue');

buttonLibraryWatched.addEventListener('click', () => {
  showMoviesFromLocalstorage('watched');
  buttonLibraryWatched.classList.add('highlighted');
  buttonLibraryQueue.classList.remove('highlighted');
});

buttonLibraryQueue.addEventListener('click', () => {
  showMoviesFromLocalstorage('queue');
  buttonLibraryQueue.classList.add('highlighted');
  buttonLibraryWatched.classList.remove('highlighted');
});

// Объект с обработчиками роутов
const routes = {
  '/': home,
  '/library': library,
};

searchForm.addEventListener('submit', checkForm);
pagination.addEventListener('click', gotoPage);

function displayElement(element, isHide) {
  if (element) {
    // Скрываем элемент
    element.style.display = isHide ? 'block' : 'none';
  }
}

async function showMoviesFromLocalstorage(keyOfStorage) {
  const queueArray = loadArayFromLocalStorage(keyOfStorage);
  if (queueArray.length > 0) {
    // проверка на пустой массив
    const arrayOfPromises = queueArray.map(async movieId => {
      const { data } = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=${LANGUAGE}`
      );
      return data;
    });
    // 2. Запускаем все промисы параллельно и ждем их завершения
    const movies = await Promise.all(arrayOfPromises);
    console.log(movies);
    renderMoviesFromLocalstorageArray(movies);
  }
}

// TODO Неплохо бы заменить эту функцию renderMovies предварительно приготовив нормально данные с локалстореджа, которые она сможет съесть
function renderMoviesFromLocalstorageArray(data) {
  const movies = data
    .map(movie => {
      return `
      <li class="movie">
        <a href="#show-moovie=${movie.id}"
         class="movie__link" data-movie="${movie.id}">
        <img class="movie__image" ${
          movie.poster_path
            ? 'src="https://image.tmdb.org/t/p/w300' + movie.poster_path + '">'
            : 'src="' + noImg + '">'
        }
        </a>
        <h2 class="movie__title">${movie.title}</h2>
        <p class="movie__description">
          ${movie.genres.map(({ name }) => name).join(', ')}
         | <span>
        ${getYearFromDate(movie.release_date)}
        </span>
        <span class="movie__rating">${movie.vote_average}</span>
        </p>
        </li>`;
    })
    .join(''); //${getYearFromDate(movie.release_date)}    ${getGenreById(
  console.log(data);

  movieContainer.innerHTML = movies;

  addClickListenerToMovie();
}

// Функция, которая будет вызываться для обработки роута '/'
function home() {
  console.log('Home page');

  // Парсим параметры запроса
  const params = new URLSearchParams(window.location.search);

  // Проверяем, что есть параметр search
  if (params.has('search')) {
    console.log(`Search: ${params.get('search')}`);
  }

  searchWordToInput();

  getGenres().then(genresArray => {
    genres = genresArray;
    getFilmsByUrl(getUrlFromSearchParam());
  });
}

// Функция, которая будет вызываться для обработки роута '/library'
function library() {
  displayElement(searchForm, false);
  displayElement(libraryButtonsBlock, true);
  showMoviesFromLocalstorage('queue');
  setRoute('library', { mode: 'queue' });
  highlighteHeaderButtons();
}

function highlighteHeaderButtons() {
  if (getRoute('mode') === 'queue') {
    buttonLibraryQueue.classList.add('highlighted');
  }
  if (getRoute('mode') === 'watched') {
    buttonLibraryWatched.classList.add('highlighted');
  }
}

//setRoute('/', { search: 'avatar' }).

function getRoute(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

function setRoute(route, params) {
  // Генерируем URL с параметрами
  const searchParams = new URLSearchParams(params);
  const url = `${route}?${searchParams.toString()}`;

  // Задаем URL в строке браузера
  window.history.pushState({}, '', url);
}

// Получаем текущий роут из URL
const route = window.location.pathname;
console.log('ROUTE', route);
console.log('window.location', window.location);

// Проверяем, что у нас есть обработчик для этого роута
if (routes[route]) {
  // Вызываем обработчик роута
  routes[route]();
} else {
  console.log('Route not found');
}
backdrop.addEventListener('click', ({ target }) => {
  if (target === backdrop) {
    // console.log('EEEESSS');
    backdrop.classList.add('is-hidden');
  }

  if (target.tagName === 'BUTTON' && target.classList.contains('js-watched')) {
    console.log('YES js-watched');

    addMovieToWatchedList(target.dataset.id);
    renderBackdropButtonsState(target, 'watched');
  }

  if (target.tagName === 'BUTTON' && target.classList.contains('js-queue')) {
    console.log('YES js-queue');

    addMovieToQueueList(target.dataset.id);
    renderBackdropButtonsState(target, 'queue');
  }

  console.dir(target);
});

function renderBackdropButtonsState(button, key) {
  console.log(
    '🚀 ~ file: index.js:188 ~ renderBackdropButtonsState ~ button, key',

    key
  );

  if (loadArayFromLocalStorage(key).includes(String(button.dataset.id))) {
    button.classList.add('highlighted');
  } else {
    button.classList.remove('highlighted');
  }
}

window.addEventListener('load', highlightActiveLink);

function checkForm(event) {
  event.preventDefault();
  let inputValue = searchForm.elements.search.value;

  inputValue = inputValue.trim();

  if (inputValue.length === 0) {
    return false;
  } else {
    searchForm.elements.search.value = inputValue;
    searchForm.submit();
  }
}

function searchWordToInput() {
  const currentURL = window.location.href;
  const searchWord = new URL(currentURL).searchParams.get('search');
  if (searchWord !== null) {
    searchMovieInput.value = searchWord.trim();
  }
}

function getUrlFromSearchParam() {
  const currentURL = window.location.href;
  const searchWord = new URL(currentURL).searchParams.get('search');
  const page = new URL(currentURL).searchParams.get('page');
  let query = '';
  if (searchWord) {
    query = page
      ? `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${searchWord}&page=${page}&language=${LANGUAGE}`
      : `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${searchWord}&language=${LANGUAGE}`;
  } else {
    query = page
      ? `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&page=${page}&language=${LANGUAGE}`
      : `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&language=${LANGUAGE}`;
  }
  return query;
}

function setPageToUrl(page) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('page', page);
  history.pushState({}, '', currentUrl.toString());
}

function highlightActiveLink() {
  const currentURL = window.location.href;
  const currentPage = new URL(currentURL).pathname;

  const links = document.querySelectorAll('a.header__menu-link');
  for (const link of links) {
    const linkPage = new URL(link.href).pathname;
    if (currentPage === linkPage) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  }
}

function gotoPage({ target }) {
  if (target.tagName === 'BUTTON') {
    currentPage = Number(target.dataset.gotopage);
    setPageToUrl(currentPage);
    getFilmsByUrl(getUrlFromSearchParam());
  }
}

function displayPagination(response) {
  let pages = [];

  // if (totalPages > 1) {
  if (response.total_pages > 1) {
    if (pageLinks >= response.total_pages) {
      pageLinks = response.total_pages;
    }

    if (currentPage <= 1 + paginationRange) {
      startPaginationPage = 1;
      stopPaginationPage = pageLinks;
    } else {
      startPaginationPage = currentPage - paginationRange;

      stopPaginationPage = currentPage + paginationRange;
      if (stopPaginationPage > response.total_pages) {
        stopPaginationPage = response.total_pages;
      }
    }

    pages.push(
      `<button data-gotopage="${startPaginationPage}" class="pagination__button back" type="button"></button>`
    );
    for (let i = startPaginationPage; i <= stopPaginationPage; i += 1) {
      if (currentPage === i) {
        pages.push(
          `<button data-gotopage="${i}" class="pagination__button current" type="button">${i}</button>`
        );
      } else {
        pages.push(
          `<button data-gotopage="${i}" class="pagination__button" type="button">${i}</button>`
        );
      }
    }

    pages.push(
      `<button data-gotopage="${stopPaginationPage}" class="pagination__button forward" type="button"></button>`
    );

    pagination.innerHTML = pages.join('');
  }
}

function getYearFromDate(date) {
  const dateRelease = new Date(date);
  return dateRelease.getFullYear();
}

function renderMovieDetails(data) {
  console.log(data);
  backdrop.classList.remove('is-hidden');
  const content = `
  
  <img class="movie-detail__image" ${
    data.poster_path
      ? 'src="https://image.tmdb.org/t/p/w300' + data.poster_path + '">'
      : 'src="' + noImg + '">'
  }
  <h1 class="movie-detail__title">${data.title}</h1>

  <table class="movie-detail__table">
<tbody>
  <tr>
    <td><span class="movie-detail__title-table-titles">Vote / Votes</span></td>
    <td>${data.vote_average} / ${data.vote_count}</td>
  </tr>
  <tr>
    <td><span class="movie-detail__title-table-titles">Popularity</span></td>
    <td>${data.popularity}</td>
  </tr>
  <tr>
    <td><span class="movie-detail__title-table-titles">Original Title</span></td>
    <td>${data.original_title}</td>
  </tr>
  <tr>
    <td><span class="movie-detail__title-table-titles">Genre</span></td>
    <td>${getGenre(data.genres)}</td>
  </tr>
</tbody>
</table>

<h2 class="movie-detail__about">About</h2>
  <p class="movie-detail__about-text">
  ${data.overview}
  </p>
  <div class="movie-detail__buttons-wrapper">
  <button
  class="movie-detail__button js-watched ${highlightedButton(
    data.id,
    'watched'
  )}" data-id="${data.id}" type="button">add to Watched</button>
  <button
  class="movie-detail__button js-queue ${highlightedButton(
    data.id,
    'queue'
  )}" data-id="${data.id}" type="button">add to queue</button>
  </div>
  `;
  backdrop.querySelector('.movie-info').innerHTML = content;
}

// TODO заменить это на рендер кнопок, которые опрашивают локалсторедж и ставят highlighted
function highlightedButton(idMovie, key) {
  // можно заменить
  if (loadArayFromLocalStorage(key).includes(String(idMovie))) {
    return 'highlighted';
  }
  return '';
}

function getGenre(arr) {
  let genresOutput = [];
  for (const genre of arr) {
    genresOutput.push(genre.name);
  }

  return genresOutput.join(', ');
}

function addMovieToWatchedList(id) {
  saveIdMovieToLocalStorage(id, 'watched', 'queue');
}

function addMovieToQueueList(id) {
  saveIdMovieToLocalStorage(id, 'queue', 'watched');
}

function saveIdMovieToLocalStorage(idMovie, key, keyToFindDuplicate) {
  let args = loadFromLocalStorage(key); // переписать на loadArayFromLocalStorage
  let duplicateKey = loadFromLocalStorage(keyToFindDuplicate); //  переписать на loadArayFromLocalStorage
  let arr = [];
  if (!args) {
    arr.push(idMovie);
  } else {
    arr.push(...args);
    if (!arr.includes(idMovie)) {
      arr.push(idMovie);
    }
  }
  saveToLocalStorage(key, arr);
  // удаление дубликата в массиве keyToFindDuplicate
  if (duplicateKey) {
    if (duplicateKey.indexOf(idMovie) !== -1) {
      duplicateKey.splice(duplicateKey.indexOf(idMovie), 1);
      saveToLocalStorage(keyToFindDuplicate, duplicateKey);
    }
  }
}

function saveToLocalStorage(key, value) {
  try {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error('Set state error: ', error.message);
  }
}

function loadFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState === null ? undefined : JSON.parse(serializedState);
  } catch (error) {
    console.error('Get state error: ', error.message);
  }
}

function loadArayFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState === null ? [] : JSON.parse(serializedState);
  } catch (error) {
    console.error('Get state error: ', error.message);
  }
}

function showMovieDetails(id) {
  console.log(id);
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}&language=${LANGUAGE}`;
  axios
    .get(url)
    .then(response => {
      renderMovieDetails(response.data);
    })
    .catch(function (error) {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.data.status_message);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log('Error', error.message);
      }
    });
}

function renderMovies({ data }) {
  const movie = data.results
    .map(movie => {
      return `
      <li class="movie">
        <a href="#show-moovie=${movie.id}" 
         class="movie__link" data-movie="${movie.id}">
        <img class="movie__image" ${
          movie.poster_path
            ? 'src="https://image.tmdb.org/t/p/w300' + movie.poster_path + '">'
            : 'src="' + noImg + '">'
        }
        </a>
        <h2 class="movie__title">${movie.title}</h2>
        <p class="movie__description">${getGenreById(
          movie.genre_ids,
          genres
        )} | <span>${getYearFromDate(movie.release_date)}</span></p>
        </li>`;
    })
    .join('');

  movieContainer.innerHTML = movie;

  addClickListenerToMovie();
}

function addClickListenerToMovie() {
  document.querySelectorAll('.movie__link').forEach(element => {
    element.addEventListener('click', () => {
      showMovieDetails(element.dataset.movie);
    });
  });
}

function getFilmsByUrl(url) {
  axios
    .get(url)
    .then(response => {
      renderMovies(response);
      currentPage = response.data.page;
      totalPages = response.data.total_pages;
      displayPagination(response.data);
    })
    .catch(function (error) {
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.data.status_message);
      } else if (error.request) {
        console.log(error.request);
      } else {
        console.log('Error', error.message);
      }
    });
}

async function getGenres() {
  return axios
    .get(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=${LANGUAGE}` //language=en-US
    )
    .then(({ data }) => {
      // console.log('ЖАНРЫ ', data.genres);
      return data.genres;
    });
}

function getGenreById(ids, arrGanres) {
  let arrNamesGenres = [];

  for (const id of ids) {
    for (const genre of arrGanres) {
      if (genre.id === id) {
        arrNamesGenres.push(genre.name);
      }
    }
  }

  // console.log(arrNamesGenres);
  return arrNamesGenres.length > 0
    ? arrNamesGenres.join(', ')
    : 'Genre not set';
}
