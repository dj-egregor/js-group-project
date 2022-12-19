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

const movieContainer = document.querySelector('.movies-container');
const pagination = document.querySelector('.pagination');
const searchMovieInput = document.querySelector('.search-form__input');
const searchForm = document.querySelector('.search-form');
const backdrop = document.querySelector('.backdrop');
// const linkToMovies = document.querySelectorAll('.movie__link');

searchForm.addEventListener('submit', checkForm);
pagination.addEventListener('click', gotoPage);
backdrop.addEventListener('click', () => {
  backdrop.classList.add('is-hidden');
});
// linkToMovie.addEventListener('click', showMovieDetails);

window.addEventListener('load', highlightActiveLink);

// function update

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
  <button class="movie-detail__button" type="button">add to Watched</button>
  <button class="movie-detail__button" type="button">add to queue</button>
  </div>
  
  `;
  backdrop.querySelector('.movie-info').innerHTML = content;
}

function getGenre(arr) {
  let genresOutput = [];
  for (const genre of arr) {
    genresOutput.push(genre.name);
  }

  return genresOutput.join(', ');
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

searchWordToInput();

getGenres().then(genresArray => {
  genres = genresArray;
  getFilmsByUrl(getUrlFromSearchParam());
});
