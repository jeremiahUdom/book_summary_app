const redirectBtn = document.querySelector(".redirect-btn");
const authBtn = document.querySelector("#auth-btn");
const authFormTitle = document.querySelector(".auth-form-title");
const redirectTxt = document.querySelector(".redirect-txt");
const authForm = document.querySelector(".auth-form");

const changeForm = (e) => {
  const currentAction = redirectBtn.dataset.action;
  
  if (currentAction === "signup"){
    redirectBtn.dataset.action = "login";
    authForm.setAttribute("action", "/signup");
    console.log(authForm, "---s");
    authFormTitle.textContent = "Sign Up";
    authBtn.textContent = "Sign Up";
    redirectBtn.textContent = "Login";
    redirectTxt.textContent = "Already";
  } else {
    redirectBtn.dataset.action = "signup";
    authForm.setAttribute("action", "/login");
    console.log(authForm, "----l")
    authFormTitle.textContent = "Login";
    authBtn.textContent = "Login";
    redirectBtn.textContent = "Sign Up";
    redirectTxt.textContent = "Don't";
  }
}

redirectBtn.addEventListener("click", changeForm);