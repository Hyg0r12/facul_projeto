const API_USUARIOS = "../api/usuarios";
let codigoGerado = null;
let emailRecuperacao = null;

async function enviarCodigo() {
    const email = document.getElementById("email").value.trim();

    if (email === "") {
        mostrarMensagem("Digite seu e-mail!", "red");
        return;
    }

    try {
        const resposta = await fetch(`${API_USUARIOS}/existe?email=${encodeURIComponent(email)}`);
        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Nao foi possivel verificar o e-mail.");
        }

        if (!dados.existe) {
            mostrarMensagem("E-mail nao encontrado!", "red");
            return;
        }

        codigoGerado = Math.floor(1000 + Math.random() * 9000).toString();
        emailRecuperacao = email;

        mostrarMensagem("Codigo enviado! Seu codigo e: " + codigoGerado, "blue");
        document.getElementById("codigoArea").style.display = "block";
    } catch (erro) {
        mostrarMensagem(erro.message, "red");
    }
}

async function redefinirSenha() {
    const codigoDigitado = document.getElementById("codigo").value.trim();
    const novaSenha = document.getElementById("novaSenha").value;

    if (codigoDigitado !== codigoGerado) {
        mostrarMensagem("Codigo incorreto!", "red");
        return;
    }

    if (novaSenha.length < 6) {
        mostrarMensagem("A senha deve ter pelo menos 6 caracteres!", "red");
        return;
    }

    try {
        const resposta = await fetch(`${API_USUARIOS}/senha`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailRecuperacao,
                senha: novaSenha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Nao foi possivel redefinir a senha.");
        }

        mostrarMensagem("Senha redefinida com sucesso!", "green");

        setTimeout(function() {
            window.location.href = "../Login/Login.html";
        }, 2000);
    } catch (erro) {
        mostrarMensagem(erro.message, "red");
    }
}

function mostrarMensagem(texto, cor) {
    const mensagem = document.getElementById("mensagem");
    mensagem.textContent = texto;
    mensagem.style.color = cor;
}
