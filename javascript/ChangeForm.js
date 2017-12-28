(function(EventEmitter, tmpl, Cognito) {

  var $root = document.getElementById('root'),
    $container = document.createElement('div'),
    $button,
    $link,
    $title,
    $close,
    $form;

  function startLoading() {
    removeAlert()
    $button = $container.querySelectorAll('input[type=submit]')[0];
    $button.disabled = true;
    $button.value = 'Loading...';
  }

  function stopLoading() {
    $button.disabled = false;
    $button.value = 'Change Password!'
  }

  function addAlert(options) {
    $title.insertAdjacentHTML('afterend', tmpl('Alert', options));
    $close = $container.getElementsByClassName('Alert__close')[0];
    $close.addEventListener('click', handleClose);
  }

  function removeAlert() {
    $alert = $container.getElementsByClassName('Alert')[0];
    $alert && $alert.remove();
    $close && $close.removeEventListener('click', handleClose);
  }

  function handleClose(event) {
    event.target.parentNode.remove()
  }

  function handleLoginLink(event) {
    event.preventDefault();
    EventEmitter.emit('ChangeForm:unmount');
    EventEmitter.emit('LoginForm:mount');
  }

  function handleSubmit(event) {
    var $inputs = $container.getElementsByTagName('input'),
      attributes;
    event.preventDefault()


    if (($.trim($inputs.email.value) === "") ||
        ($.trim($inputs.password.value) === "") ||
        ($.trim($inputs.newpassword.value) === "") ||
        ($.trim($inputs.repeatpassword.value) === ""))
  {
        console.log('Please enter all the values!')
        addAlert({
          type: 'error',
          message: 'Please enter all the values!',
        })
        return;
    }


    if ($inputs.password.value === $inputs.newpassword.value) {
      console.log('Old and New Passwords cannot be the same!')
      addAlert({
        type: 'error',
        message: 'Old and New Passwords cannot be the same!',
      })
      return;
    }
    if ($inputs.newpassword.value !== $inputs.repeatpassword.value) {
      console.log('Passwords do not match!')
      addAlert({
        type: 'error',
        message: 'Passwords do not match!',
      })
      return;
    }
    startLoading()

    $(".Alert__close").click();
    //Cognito.authenticateUser($inputs.email.value, $inputs.password.value)
    Cognito.logIn($inputs.email.value, $inputs.password.value)
    .then(function(result) {
      stopLoading()
      addAlert({
        type: 'success',
        message: 'Log in successful! Getting user...'
      })

      Cognito.change($inputs.email.value, $inputs.password.value, $inputs.newpassword.value)
      .then(function(result) {
        stopLoading()
        $(".Alert__close").click();
        addAlert({
          type: 'success',
          message: 'Password Changed Succesfully. Please login with your new credentials.',
        })
        console.log(result)
      })
      .catch(function(error) {
        stopLoading()
          $(".Alert__close").click();
        addAlert({
          type: 'error',
          message: error.message,
        })
        console.error(error)
      })
    })
    .catch(function(error) {
      stopLoading()
      console.log(error.message)
        $(".Alert__close").click();
      // If the user needs to enter its confirmation code switch to the
      // confirmation form page.
      if (error.message === 'User is not confirmed.') {
        EventEmitter.emit('ConfirmForm:mount', {
          email: $inputs.email.value,
        });
        EventEmitter.emit('LoginForm:unmount');
        return;
      }
      addAlert({
        type: 'error',
        message: error.message,
      })
      console.error(error)
    })

  }

  EventEmitter.on('ChangeForm:mount', function() {
    Cognito.isNotAuthenticated()
    .then(function() {
      $container.innerHTML = tmpl('ChangeForm', {})
      $link = $container.getElementsByClassName('Control__link')[0]
      $form = $container.getElementsByTagName('form')[0]
      $title = $container.getElementsByClassName('title')[0]
      $link.addEventListener('click', handleLoginLink)
      $form.addEventListener('submit', handleSubmit)
      $root.appendChild($container)
    })
    .catch(function() {
      EventEmitter.emit('ChangeForm:unmount');
      EventEmitter.emit('Welcome:mount');
    })
  })

  EventEmitter.on('ChangeForm:unmount', function() {
    $link.removeEventListener('click', handleLoginLink)
    $form.removeEventListener('submit', handleSubmit)
    $container.remove()
  })

})(
  window.EventEmitter,
  window.tmpl,
  window.Cognito
)
