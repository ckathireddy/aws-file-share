const authStatus = localStorage.getItem("Auth");
if (authStatus == "true") {
  window.location.href = "home";
}

const loginForm = document.querySelector("#login-form");
const loginLink = document.getElementById("login-link");
const loginBtn = document.getElementById("login-btn");
const signupForm = document.querySelector("#signup-form");
const signupLink = document.getElementById("signup-link");
const signupBtn = document.getElementById("signup-btn");

if (signupLink) {
  signupLink.addEventListener("click", (event) => {
    window.location.href = "signup";
  });
}

if (loginLink) {
  loginLink.addEventListener("click", (event) => {
    window.location.href = "login";
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", (event) => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    if (email == "" || password == "") {
      alert("Please fill the required fields");
    } else {
      fetch("/login", {
        method: "POST",
        body: JSON.stringify({ email: email, password: password }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.detail) {
            alert(data.detail);
          } else if (data.username && data.email) {
            localStorage.setItem("username", data.username);
            localStorage.setItem("email", data.email);
            localStorage.setItem("Auth", "true");
            window.location.href = "login";
          } else {
            alert("Issue with the server");
          }
        })
        .catch((error) => {
          alert("Issue with the server try again");
        });
    }
  });
}

if (signupBtn) {
  signupBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (email == "" || name == "" || password == "") {
      alert("Please fill the required fields");
    } else {
      fetch("/signup", {
        method: "POST",
        body: JSON.stringify({ name: name, email: email, password: password }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.detail && data.status) {
            alert(data.detail);
            window.location.href = "login";
          } else if (data.detail) {
            alert(data.detail);
          } else {
            alert("Issue with the server try again");
          }
        })
        .catch((error) => {
          alert("Issue with the server try again");
        });
    }
  });
}
