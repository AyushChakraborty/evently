const form = document.getElementById("signupform") as HTMLFormElement; //the type part, lmao

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    first_name: (document.getElementById("first_name") as HTMLInputElement)
      .value,
    last_name: (document.getElementById("last_name") as HTMLInputElement).value,
    email: (document.getElementById("email") as HTMLInputElement).value,
    password: (document.getElementById("password") as HTMLInputElement).value,
    phone: (document.getElementById("phone") as HTMLInputElement).value,
  };

  const res = await fetch("/student/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = document.getElementById("result");
  if (res.ok) {
    const msg = await res.json();
    if (result) {
      result.textContent = msg.message;
    }
  } else {
    const err = await res.json();
    if (result) {
      result.textContent = `Error: ${err.detail}`;
    }
  }
});
