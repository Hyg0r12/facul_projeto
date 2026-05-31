const API_LOGIN = "../api/usuarios/login";

document.querySelector("form").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value;

    try {
        const resposta = await fetch(API_LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "E-mail ou senha incorretos.");
        }

        localStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
        window.location.href = "../map/map.html";
    } catch (erro) {
        alert(erro.message);
    }
});
