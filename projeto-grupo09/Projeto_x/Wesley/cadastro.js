const API_CADASTRO = "../api/usuarios/cadastro";

document.getElementById("cadastroForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const cpf = document.getElementById("cpf").value.trim();
    const telefone = document.getElementById("numero").value.trim();
    const dataNascimento = document.getElementById("idade").value;
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (nome === "") {
        alert("Preencha o nome");
        return;
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(email)) {
        alert("E-mail invalido");
        return;
    }

    const cpfValido = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfValido.test(cpf)) {
        alert("CPF invalido (use formato 000.000.000-00)");
        return;
    }

    const telValido = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
    if (!telValido.test(telefone)) {
        alert("Telefone invalido (use formato (00) 00000-0000)");
        return;
    }

    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtualAntesDoAniversario = hoje.getMonth() < nascimento.getMonth();
    const diaAtualAntesDoAniversario = hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate();

    if (mesAtualAntesDoAniversario || diaAtualAntesDoAniversario) {
        idade--;
    }

    if (idade < 18) {
        alert("Voce precisa ter pelo menos 18 anos");
        return;
    }

    if (senha.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres");
        return;
    }

    if (senha !== confirmarSenha) {
        alert("As senhas nao coincidem");
        return;
    }

    try {
        const resposta = await fetch(API_CADASTRO, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                nome,
                email,
                cpf,
                telefone,
                dataNascimento,
                senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Nao foi possivel cadastrar.");
        }

        alert("Cadastro realizado com sucesso!");
        window.location.href = "../Login/Login.html";
    } catch (erro) {
        alert(erro.message);
    }
});
