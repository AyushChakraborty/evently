var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const form = document.getElementById("signupform"); //the type part, lmao
form.addEventListener("submit", (e) => __awaiter(this, void 0, void 0, function* () {
    e.preventDefault();
    const data = {
        first_name: document.getElementById("first_name")
            .value,
        last_name: document.getElementById("last_name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value,
    };
    const res = yield fetch("/student/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    const result = document.getElementById("result");
    if (res.ok) {
        const msg = yield res.json();
        if (result) {
            result.textContent = msg.message;
        }
    }
    else {
        const err = yield res.json();
        if (result) {
            result.textContent = `Error: ${err.detail}`;
        }
    }
}));
