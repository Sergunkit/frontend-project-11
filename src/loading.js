import axios from 'axios';
import _ from 'lodash';
import parse from './rss.js';

const fetchingTimeout = 5000;

const getLoadingProcessErrorType = (e) => {
  if (e.isParsingError) {
    return 'noRSS';
  }
  if (e.isAxiosError) {
    return 'netErr';
  }
  return 'unknown';
};

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getRssList = (watchedState, url) => {
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
      localWatchedState.loadingProcess.error = getLoadingProcessErrorType(err);
      localWatchedState.loadingProcess.status = 'failed';
    });
};

const getNewPosts = (watchedSate) => {
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
    setTimeout(() => getNewPosts(watchedSate), fetchingTimeout);
  });
};

export { getRssList, getNewPosts };
