import onChange from 'on-change';

export default (initState, elements, i18next) => {
  const handleInput = (state) => {
    const { form: { error, valid } } = state;
    const { input, feedback } = elements;

    if (valid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18next.t([`errors.${error}`, 'errors.unknown']);
    }
  };
  const handleLoadingProcessStatus = (state) => {
    const { loadingProcess } = state;
    const { submit, input, feedback } = elements;

    switch (loadingProcess.status) {
      case 'failed':
        submit.disabled = false;
        input.removeAttribute('readonly');
        feedback.classList.add('text-danger');
        feedback.textContent = i18next.t([`errors.${loadingProcess.error}`, 'errors.unknown']);
        break;
      case 'success':
        submit.disabled = false;
        input.removeAttribute('readonly');
        input.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18next.t('loadSuccess');
        input.focus();
        break;
      case 'loading':
        submit.disabled = true;
        input.setAttribute('readonly', true);
        feedback.classList.remove('text-success');
        feedback.classList.remove('text-danger');
        feedback.innerHTML = '';
        break;
      default:
        throw new Error(`Unknown loadingProcess status: '${loadingProcess.status}'`);
    }
  };

  const handleFeeds = (state) => {
    const { feeds } = state;
    const { feedBox } = elements;
    const container = document.createElement('div');
    container.classList.add('card', 'border-0');
    const div = document.createElement('div');
    div.classList.add('card-body');
    container.appendChild(div);
    const feedsTitle = document.createElement('h2');
    feedsTitle.classList.add('card-title', 'h4');
    feedsTitle.textContent = i18next.t('feeds');
    container.querySelector('.card-body').appendChild(feedsTitle);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'raunded-0');

    const feedsListItems = feeds.map((feed) => {
      const element = document.createElement('li');
      element.classList.add('list-group-item', 'border-0', 'border-end-0');
      const title = document.createElement('h3');
      title.classList.add('h6', 'm-0');
      title.textContent = feed.title;
      const description = document.createElement('p');
      description.classList.add('m-0', 'small', 'text-black-50');
      description.textContent = feed.description;
      element.append(title, description);
      return element;
    });

    feedsList.append(...feedsListItems);
    container.appendChild(feedsList);
    feedBox.innerHTML = '';
    feedBox.appendChild(container);
  };

  const handlePosts = (state) => {
    const { posts } = state;
    const { postBox } = elements;

    const container = document.createElement('div');
    container.classList.add('card', 'border-0');
    const div = document.createElement('div');
    div.classList.add('card-body');
    container.appendChild(div);
    const postsTitle = document.createElement('h2');
    postsTitle.classList.add('card-title', 'h4');
    postsTitle.textContent = i18next.t('posts');
    container.querySelector('.card-body').appendChild(postsTitle);

    const postList = document.createElement('ul');
    postList.classList.add('list-group', 'border-0', 'rounded-0');

    const postsListItems = posts.map((post) => {
      const element = document.createElement('li');
      element.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const link = document.createElement('a');
      link.setAttribute('href', post.link);
      link.classList.add('fw-bold');
      link.dataset.id = post.id;
      link.textContent = post.title;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'nooper noreferrer');
      element.appendChild(link);
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.dataset.id = post.id;
      element.appendChild(button);
      return element;
    });

    postList.append(...postsListItems);
    container.appendChild(postList);
    postBox.innerHTML = '';
    postBox.appendChild(container);
  };

  const watchedState = onChange(initState, (path) => {
    switch (path) {
      case 'form':
        handleInput(initState);
        break;
      case 'loadingProcess.status':
        handleLoadingProcessStatus(initState);
        break;
      case 'feeds':
        handleFeeds(initState);
        break;
      case 'posts':
        handlePosts(initState);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
