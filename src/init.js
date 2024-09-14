import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import watcher from './watchers.js';
import resources from './locales/index.js';
import locale from './locales/locale.js';
import { getRssList, getNewPosts } from './loading.js';

const fetchingTimeout = 5000;

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.rss-form input'),
    feedback: document.querySelector('.feedback'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedBox: document.querySelector('.feeds'),
    postBox: document.querySelector('.posts'),
    modal: document.querySelector('#modal'),
  };

  const initState = {
    feeds: [],
    posts: [],
    loadingProcess: {
      status: 'success',
      error: null,
    },
    form: {
      error: null,
      valid: false,
      status: 'filling',
    },
    modal: {
      postId: null,
    },
    ui: {
      seenPosts: new Set(),
    },
  };

  const i18nextInstance = i18next.createInstance();

  const promise = i18nextInstance.init({
    lng: 'ru',
    resources,
  })
    .then(() => {
      yup.setLocale(locale);
      const validateUrl = (url, feeds) => {
        const feedUrls = feeds.map((feed) => feed.url);
        const schema = yup.string().url().required().notOneOf(feedUrls);

        return schema.validate(url)
          .then(() => null)
          .catch((err) => err.message);
      };

      const watchedState = watcher(initState, elements, i18nextInstance);

      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(event.target);
        const url = data.get('url');

        validateUrl(url, watchedState.feeds)
          .then((err) => {
            if (!err) {
              watchedState.form = {
                ...watchedState.form,
                error: null,
                valid: true,
              };
              getRssList(watchedState, url);
            } else {
              watchedState.form = {
                ...watchedState.form,
                error: err.key,
                valid: false,
              };
            }
          });
      });

      elements.postBox.addEventListener('click', (event) => {
        if (!('id' in event.target.dataset)) {
          return;
        }
        const { id } = event.target.dataset;
        watchedState.modal.postId = String(id);
        watchedState.ui.seenPosts.add(id);
      });

      setTimeout(() => getNewPosts(watchedState), fetchingTimeout);
    });
  return promise;
};
