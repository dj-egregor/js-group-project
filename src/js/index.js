const axios = require('axios').default;
const API_KEY = '31449444226ba6345698313fe055564a';
const LANGUAGE = 'ru';
//https://api.themoviedb.org/3/configuration/languages?api_key=31449444226ba6345698313fe055564a

import noImg from '../images/no-image.jpg';

let genres = [];

// НАСТРОЙКА ПАГИНАЦИИ
let totalPages = 0;
let currentPage = 1;
let pageLinks = 5; //   количество кнопок ((нечетные числа, пример - 1 2 [3] 4 5))
const paginationRange = Math.floor(pageLinks / 2);
let startPaginationPage = 1;
let stopPaginationPage = pageLinks;
//------------------------------------------------

const movieContainer = document.querySelector('.js-movies-container');
const pagination = document.querySelector('.js-paginator');
const searchMovieInput = document.querySelector('.js-search-form__input');
const searchForm = document.querySelector('.js-search-form');
const backdrop = document.querySelector('.backdrop');
const libraryButtonsBlock = document.querySelector('.js-library-buttons-block');
const buttonLibraryWatched = document.querySelector('.js-watched');
const buttonLibraryQueue = document.querySelector('.js-queue');

window.addEventListener('load', highlightActiveLink); // подсветка кнопок текущей страницы в хедере

// Клик на кнопку  WATCHED в хедере
buttonLibraryWatched.addEventListener('click', () => {
  showMoviesFromLocalstorage('watched');
  buttonLibraryWatched.classList.add('highlighted');
  buttonLibraryQueue.classList.remove('highlighted');
  setRoute('library', { mode: 'watched' }); // переходим на  список watched
});

// Клик на кнопку  QUEUE в хедере
buttonLibraryQueue.addEventListener('click', () => {
  showMoviesFromLocalstorage('queue');
  buttonLibraryQueue.classList.add('highlighted');
  buttonLibraryWatched.classList.remove('highlighted');
  setRoute('library', { mode: 'queue' }); // переходим на  список queue
});

// Объект с обработчиками роутов (навигация)
const routes = {
  '/': home,
  '/js-group-project/': home, // ИСПРАВИТЬ НА ПУТЬ ПРОЕКТА НА GITHUB
  '/library': library,
  '/js-group-project/library': library, // ИСПРАВИТЬ НА ПУТЬ ПРОЕКТА НА GITHUB
};

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

//-------------------------------------- BACKDROP
//
// обработчик кликов на бэкдропе, закрытие его, реакция на кнопки ...
backdrop.addEventListener('click', ({ target }) => {
  // закрытие бэкдропа
  if (target === backdrop) {
    backdrop.classList.add('is-hidden');
  }

  // ловим нажатие на кнопку js-watched
  if (target.tagName === 'BUTTON' && target.classList.contains('js-watched')) {
    const idMovie = target.dataset.id;
    console.log('PRESSED js-watched', idMovie);

    // проверка, есть ли ужу в watched такой фильм если есть то deleteMovieFromLocalStorage
    if (loadArayFromLocalStorage('watched').includes(String(idMovie))) {
      console.log('УДАЛИТЬ ', idMovie);
      deleteMovieFromLocalStorage(idMovie, 'watched');
    } else {
      // если же нет, то добавляем в список watched
      addMovieToWatchedList(target.dataset.id);
    }
    renderBackdropButtonsState(target);

    // showMoviesFromLocalstorage('watched'); // обновляем содержимое списка на странице
    if (getRoute('mode')) {
      //проверяем, есть ли запрос mode
      showMoviesFromLocalstorage(getRoute('mode')); // обновляем содержимое списка на странице
    }
  }

  // ловим нажатие на кнопку js-queue
  if (target.tagName === 'BUTTON' && target.classList.contains('js-queue')) {
    const idMovie = target.dataset.id;
    console.log('PRESSED js-queue');

    // проверка, есть ли ужу в queue такой фильм если есть то deleteMovieFromLocalStorage
    if (loadArayFromLocalStorage('queue').includes(String(idMovie))) {
      console.log('УДАЛИТЬ ', idMovie);
      deleteMovieFromLocalStorage(idMovie, 'queue');
    } else {
      // если же нет, то добавляем в список queue
      addMovieToQueueList(target.dataset.id);
    }
    renderBackdropButtonsState(target);
    if (getRoute('mode')) {
      //проверяем, есть ли запрос mode
      showMoviesFromLocalstorage(getRoute('mode')); // обновляем содержимое списка на странице
    }
  }
  // в консоль выводим место куда нажали
  console.dir(target);
});

searchForm.addEventListener('submit', checkForm); // проверка формы при поиске фильма
pagination.addEventListener('click', gotoPage); // переход на страницу в пагинаторе

// показывает или склывает элемент true показать, false скрыть, также передаем элемент
function displayElement(element, isHide) {
  if (element) {
    // Скрываем элемент
    element.style.display = isHide ? 'block' : 'none';
  }
}

async function showMoviesFromLocalstorage(keyOfStorage) {
  //  показывает фильмы по ключу переменной в Localstorage
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
  } else {
    movieContainer.innerHTML = ''; // Если фильмов нет, то очищаем
  }
}

// выводит на страницу список фильмов из локалсторедж, тебует параметр data массив с списком объектов - фильмов
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
  displayElement(searchForm, false); // убираю форму поиска
  displayElement(libraryButtonsBlock, true); // показываю кнопки watched и queue

  const mode = getRoute('mode') || 'queue'; // если маршрут пустой то по умолчанию переходим на страницу 'queue'
  console.log('🚀 ~ file: index.js:200 ~ library ~ mode', mode);

  showMoviesFromLocalstorage(mode); // показываю фильмы из сохраненных в локалсторедже
  setRoute('library', { mode: mode }); // по умочанию переходим на  список queue
  highlighteHeaderButtons(); // крашу кнопки
}

// подсветка кнопок (Watched queue) на странице my -library
function highlighteHeaderButtons() {
  // подсветка кнопок ЦФ
  if (getRoute('mode') === 'queue') {
    buttonLibraryQueue.classList.add('highlighted');
  }
  if (getRoute('mode') === 'watched') {
    buttonLibraryWatched.classList.add('highlighted');
  }
}

function getRoute(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

//setRoute('/', { search: 'avatar' }).
function setRoute(route, params) {
  // Генерируем URL с параметрами
  const searchParams = new URLSearchParams(params);
  const url = `${route}?${searchParams.toString()}`;

  // Задаем URL в строке браузера
  window.history.pushState({}, '', url);
}

// обновляет визуальное и текстовое состояния кнопок на бэкдропе TODO переписать на render и брать статус кнопок в свойствах объекта
function renderBackdropButtonsState() {
  const buttonJsWatched = backdrop.querySelector('button.js-watched');

  const buttonJsQueue = backdrop.querySelector('button.js-queue');

  // вынести этот код в отдельную функцию
  if (
    loadArayFromLocalStorage('watched').includes(
      String(buttonJsWatched.dataset.id)
    )
  ) {
    buttonJsWatched.textContent = 'remove from watched';
    buttonJsWatched.classList.add('highlighted');
  } else {
    buttonJsWatched.classList.remove('highlighted');
    buttonJsWatched.textContent = 'add to watched';
  }

  if (
    loadArayFromLocalStorage('queue').includes(String(buttonJsQueue.dataset.id))
  ) {
    buttonJsQueue.textContent = 'remove from queue';
    buttonJsQueue.classList.add('highlighted');
  } else {
    buttonJsQueue.classList.remove('highlighted');
    buttonJsQueue.textContent = 'add to queue';
  }
}

//  проверка данных  в форме и если все гуд то отправка
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

// генерит URL запроса к API в зависимости от параметров в адресной строке браузера
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

// меняет url в строке браузера
function setPageToUrl(page) {
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('page', page);
  history.pushState({}, '', currentUrl.toString());
}

// подсветка активной ссылки my-library и Home
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

// пагинация перейти на указанную  страницу
function gotoPage({ target }) {
  if (target.tagName === 'BUTTON') {
    currentPage = Number(target.dataset.gotopage);
    setPageToUrl(currentPage);
    getFilmsByUrl(getUrlFromSearchParam());
  }
}

//  функция отображения пагинации TODO устранить глюк при приближении к концу страниц, отображается меньше кнопок,
// Добавить последнюю страницу и три точки ... на версии больше мобилки
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

    if (currentPage > 1) {
      pages.push(
        `<button data-gotopage="${
          currentPage - 1
        }" class="pagination__button back" type="button"></button>`
      );
    }

    for (let i = startPaginationPage; i <= stopPaginationPage; i += 1) {
      console.log('🚀 ~ file: index.js:333 ~ i', i);

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

    if (currentPage < response.total_pages) {
      pages.push(
        `<button data-gotopage="${
          currentPage + 1
        }" class="pagination__button forward" type="button"></button>`
      );
    }

    pagination.innerHTML = pages.join('');
  }
}

// функция формирует год из полной даты с API
function getYearFromDate(date) {
  const dateRelease = new Date(date);
  return dateRelease.getFullYear();
}

// рендерит фильм на бэкдроп
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
  class="movie-detail__button js-watched" data-id="${
    data.id
  }" type="button">add to Watched</button>
  <button
  class="movie-detail__button js-queue" data-id="${
    data.id
  }" type="button">add to queue</button>
  </div>
  `;
  backdrop.querySelector('.movie-info').innerHTML = content;
  renderBackdropButtonsState();
}

// функция генерирует жанры TODO пересмотреть устройство, возможно заменить просто join
function getGenre(arr) {
  let genresOutput = [];
  for (const genre of arr) {
    genresOutput.push(genre.name);
  }

  return genresOutput.join(', ');
}

// сохраняет айди фильма в локалсторедж под ключем watched
function addMovieToWatchedList(id) {
  saveIdMovieToLocalStorage(id, 'watched', 'queue');
}

// сохраняет айди фильма в локалсторедж под ключем queue
function addMovieToQueueList(id) {
  saveIdMovieToLocalStorage(id, 'queue', 'watched');
}

// начинка функции addMovieToWatchedList
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

// сохраняет в локалсторедж переменную value по ключу key
function saveToLocalStorage(key, value) {
  try {
    const serializedState = JSON.stringify(value);
    localStorage.setItem(key, serializedState);
  } catch (error) {
    console.error('Set state error: ', error.message);
  }
}

// удаляет фильм  из списка в локалсторедж по ключу 'key' -watched или queue и значению id фильма
function deleteMovieFromLocalStorage(movieId, key) {
  try {
    const Movies = JSON.parse(localStorage.getItem(key));
    const updatedMovies = Movies.filter(id => id !== movieId);
    localStorage.setItem(key, JSON.stringify(updatedMovies));
  } catch (error) {}
}

// достает переменную из локалсторедж по ключу
function loadFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState === null ? undefined : JSON.parse(serializedState);
  } catch (error) {
    console.error('Get state error: ', error.message);
  }
}

// достает массив из локалсторедж по ключу, если нет массива или переменнос этим ключем то выводит []
function loadArayFromLocalStorage(key) {
  try {
    const serializedState = localStorage.getItem(key);
    return serializedState === null ? [] : JSON.parse(serializedState);
  } catch (error) {
    console.error('Get state error: ', error.message);
  }
}

// API запрос, получаем инфу о фильме по его ID
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

// создает разметку списка фильмов и добавляет его в movieContainer
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

// TODO переписать на клин по родителю, а не вешать обработчики на каждую ссылку....
function addClickListenerToMovie() {
  document.querySelectorAll('.movie__link').forEach(element => {
    element.addEventListener('click', event => {
      showMovieDetails(element.dataset.movie);
      event.preventDefault(); // предотвращаем открытие ссылки на карточке фильма
    });
  });
}

// API запрос возвращает список фильмов по URL запроса
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

// API запрос на сервер получает список жанров
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
