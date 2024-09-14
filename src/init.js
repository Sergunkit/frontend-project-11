import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import _ from 'lodash';
import axios from 'axios';
import watcher from './watchers.js';
import resources from './locales/index.js';
import locale from './locales/locale.js';
import parse from './rss.js';

const fetchingTimeout = 5000;

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getLoadingProcessErrorType = (e) => {
  if (e.isParsingError) {
    return 'noRSS';
  }
  if (e.isAxiosError) {
    return 'netErr';
  }
  return 'unknown';
};

const fetchNewPosts = (watchedSate) => {
  const promises = watchedSate.feeds.map((feed) => {
    const urlWithProxy = addProxy(feed.url);
    return axios.get(urlWithProxy)
      .then((response) => {
        const feedData = parse(response.data.contents);
        const allPosts = feedData.items.map((item) => ({ ...item, channelId: feed.id }));
        const oldPosts = watchedSate.posts.filter((post) => post.channelId === feed.id);
        const newPosts = _.differenceWith(allPosts, oldPosts, (p1, p2) => p1.title === p2.title)
          .map((post) => ({ ...post, id: _.uniqueId() }));
        watchedSate.posts.unshift(...newPosts);
      })
      .catch((err) => {
        console.error(err);
      });
  });
  Promise.all(promises).finally(() => {
    setTimeout(() => fetchNewPosts(watchedSate), fetchingTimeout);
  });
};

const loadRss = (watchedState, url) => {
  const localWatchedState = watchedState;
  localWatchedState.loadingProcess.status = 'loading';
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy)
    .then((response) => {
      const data = parse(response.data.contents);
      const feed = {
        url, id: _.uniqueId(), title: data.title, description: data.descrpition,
      };
      const posts = data.items.map((item) => ({ ...item, channelId: feed.id, id: _.uniqueId() }));
      localWatchedState.posts.unshift(...posts);
      localWatchedState.feeds.unshift(feed);

      localWatchedState.loadingProcess.error = null;
      localWatchedState.loadingProcess.status = 'success';
      localWatchedState.form = {
        ...watchedState.form,
        status: 'filling',
        error: null,
      };
    })
    .catch((err) => {
      console.log(err);
      localWatchedState.loadingProcess.error = getLoadingProcessErrorType(err);
      localWatchedState.loadingProcess.status = 'failed';
    });
};

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
              loadRss(watchedState, url);
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

      setTimeout(() => fetchNewPosts(watchedState), fetchingTimeout);
    });
  return promise;
};
