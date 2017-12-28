(function(EventEmitter, tmpl, Cognito) {
  var email,
    $root = document.getElementById('root'),
    $container = document.createElement('div'),
    $alert,
    $button,
    $link,
    $form,
    $title,
    $close;

  function handleClose(event) {
    event.target.parentNode.remove()
  }

  function startLoading() {
    removeAlert();
    $button = $container.querySelectorAll('input[type=submit]')[0];
    $button.disabled = true;
    $button.value = 'Loading...';
  }

  function stopLoading() {
    $button.disabled = false;
    $button.value = 'Proceed.'
  }

  function addAlert(options) {
    removeAlert();
    $title.insertAdjacentHTML('afterend', tmpl('Alert', options));
    $close = $container.getElementsByClassName('Alert__close')[0];
    $close.addEventListener('click', handleClose);
  }

  function removeAlert() {
    $alert = $container.getElementsByClassName('Alert')[0];
    $alert && $alert.remove();
    $close && $close.removeEventListener('click', handleClose);
  }

  function handelResendCode(event) {
    event.preventDefault();
    Cognito.resendConfirmationCode()
    .then(function(result) {
      addAlert({
        type: 'info',
        message: 'A new confirmation code was sent.'
      });
      console.log(result);
    })
    .catch(function(error) {
      addAlert({
        type: 'error',
        message: error.message,
      });
      console.error(error);
    })
  }

  function handleLoginLink(event) {
    event.preventDefault();
    redirectToLogin()
  }

  function redirectToLogin(message) {
    EventEmitter.emit('ForgotForm:unmount');
    EventEmitter.emit('LoginForm:mount', message);
  }

  function handleEmailSubmit(event) {
    event.preventDefault();
    var $inputs = $container.getElementsByTagName('input');
    if($inputs && $inputs.forgotemail && $inputs.forgotemail.value &&
      $.trim($inputs.forgotemail.value) == ""){
        addAlert({
          type: 'error',
          message: 'Enter the email address',
        })
        return;
      }
    startLoading();
    Cognito.forgot($inputs.forgotemail.value)
    .then(function(result) {
      //stopLoading();
      addAlert({
        type: 'success',
        message: 'Email confirmation done. Redirecting',
      })
      setTimeout(function(){
        $(".subForgotForm").display.style = "block";
      }, 30);
      console.log(result);
    })
    .catch(function(error) {
      stopLoading();
      addAlert({
        type: 'error',
        message: error.message,
      });
      console.log(error);
    })
  }


  function handleSubmit(event) {
    event.preventDefault();
    var $inputs = $container.getElementsByTagName('input');
    startLoading();
    Cognito.confirm(email, $inputs.code.value)
    .then(function(result) {
      //stopLoading();
      addAlert({
        type: 'success',
        message: 'Email confirmation done. Redirecting',
      })
      setTimeout(function(){
        redirectToLogin({
          type: 'info',
          message: 'Please re-enter your credentials.'
        })
      }, 3000);
      console.log(result);
    })
    .catch(function(error) {
      stopLoading();
      addAlert({
        type: 'error',
        message: error.message,
      });
      console.log(error);
    })
  }

  EventEmitter.on('ForgotForm:mount', function(options) {
    if(Cognito == null || Cognito == undefined){
      alert('null')
    }
    Cognito.isNotAuthenticated()
    .then(function() {
      //email = options.email;

      $container.innerHTML = tmpl('ForgotForm', {})
      $form = $container.getElementsByClassName('form')[0];
      $title = $container.getElementsByClassName('title')[0];
      addAlert({
        type: 'warning',
        message: 'Please confirm your email address, before proceeding into My Application',
      })
      $form.addEventListener('submit', handleEmailSubmit);
      /*
      $resend = $container.getElementsByClassName('Control__link')[0]
      $resend.addEventListener('click', handelResendCode);

      $link = $container.getElementsByClassName('Control__link')[1];
      $link.addEventListener('click', handleLoginLink);

      */
      $root.appendChild($container);

    })
    .catch(function() {
      EventEmitter.emit('ForgotForm:unmount');
      EventEmitter.emit('Welcome:mount');
    })
  })

  EventEmitter.on('ForgotForm:unmount', function() {
    $resend.removeEventListener('click', handelResendCode);
    $link.removeEventListener('click', handleLoginLink);
    $form.removeEventListener('submit', handleSubmit);
    $container.remove();
  })

})(window.EventEmitter, window.tmpl, window.Cognito)
