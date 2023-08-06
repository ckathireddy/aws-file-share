const authStatus = localStorage.getItem("Auth");
if (authStatus !== "true") {
  window.location.href = "login";
} else if (authStatus == "true") {
  const userName = localStorage.getItem("username");
  const userEmail = localStorage.getItem("email");
  document.getElementById("username").textContent = "Username: " + userName;
  document.getElementById("email").textContent = "Email: " + userEmail;
}

const emailInput = document.getElementById("email-input");
const emailTags = document.getElementById("email-tags");
const maxEmails = 5;
let emailCount = 0;
let emailsArray = [];

emailInput.addEventListener("keydown", (event) => {
  const value = event.target.value.trim();
  if (event.key === "Enter" && value !== "") {
    if (emailCount < maxEmails) {
      emailsArray.push(value);
      addEmail(value);
      event.target.value = "";
      emailCount++;
    } else {
      alert("You can only add up to 5 emails.");
    }
  }
});

function addEmail(email) {
  const tag = document.createElement("div");
  tag.classList.add("email-tag");
  tag.innerHTML = `
    <span>${email}</span>
    <span class="remove-icon">&times;</span>
  `;
  const removeIcon = tag.querySelector(".remove-icon");
  removeIcon.addEventListener("click", () => {
    emailCount--;
    let index = emailsArray.indexOf(email);

    if (index !== -1) {
      emailsArray.splice(index, 1);
    }
    tag.remove();
  });
  emailTags.appendChild(tag);
}

function submitData() {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];
  let email_msg = "";
  let file_msg = "";

  if (emailsArray.length == 0) {
    email_msg = "To submit the data atleast one mail to be added.";
  }
  if (file == undefined) {
    file_msg = " To submit the data to upload a file.";
  }

  if (email_msg != "" || file_msg != "") {
    alert(email_msg + file_msg.trim());
  }

  if (email_msg == "" && file_msg == "") {
    const formData = new FormData();
    formData.append("sender", localStorage.getItem("email"));
    formData.append("emails", emailsArray.join(","));
    formData.append("file", file);
    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        if (data.detail) {
          alert(data.detail);
        } else if (data.status && data.message) {
          alert(data.message);
        } else {
          alert("Issue with the server try again");
        }
      });
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "login";
}
