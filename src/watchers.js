import onChange from 'on-change';

export default (initState, elements, i18next) => {
  const handleForm = (state) => {
    const { form: { error, valid } } = state;
    const { input, feedback } = elements;

    if (valid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textcontent = i18next.t(`errors.${error}`);
      feedback.textContent = i18next.t([`errors.${error}`, 'errors.unknown']);
    }
  };
  const watchedState = onChange(initState, (path) => {
    switch (path) {
      case 'form':
        handleForm(initState);
        break;
      default:
        break;
    }
  });
  return watchedState;
};
