function efetoDigitacao(elementoId, texto, velocidade) {
    let elemento = document.getElementById(elementoId);
    let index = 0;
    elemento.textContent = "";

    let intervalo = setInterval(function() {
        elemento.textContent += texto[index];
        index++;

        if (index === texto.length) {
            clearInterval(intervalo);
        }
    }, velocidade);
}

efetoDigitacao("tituloCadastro", "Criar Conta", 100);