// ===== MARCADOR COLORIDO =====
function criarIcone(cor) {
    return L.divIcon({
        className: "",
        html: `<div style="
            width: 20px;
            height: 20px;
            background: ${cor};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });
}

const API_URL = "../api/acidentes";

const map = L.map("map", {
    zoomControl: false
}).setView([-23.5505, -46.6333], 13);

L.control.zoom({
    position: "bottomleft"
}).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

L.Control.geocoder({
    defaultMarkGeocode: true,
    position: "topright"
}).addTo(map);

map.locate({ setView: true, maxZoom: 16 });

map.on("locationfound", function(e) {
    L.marker(e.latlng)
        .addTo(map)
        .bindPopup("Voce esta aqui")
        .openPopup();
});

let coordenadasClique = null;
let categoriaSelecionada = null;
let acidenteEmEdicaoId = null;
let marcadores = [];

async function chamarApi(url, opcoes) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao acessar a API.");
    }

    return dados;
}

async function buscarAcidentes() {
    const dados = await chamarApi(API_URL);
    return dados.acidentes || [];
}

async function criarAcidente(acidente) {
    await chamarApi(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(acidente)
    });

    await renderizarAcidentes();
}

async function atualizarAcidente(id, dadosAcidente) {
    await chamarApi(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dadosAcidente)
    });

    await renderizarAcidentes();
}

async function excluirAcidente(id) {
    await chamarApi(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    await renderizarAcidentes();
}

function limparMapaELista() {
    marcadores.forEach(function(marker) {
        map.removeLayer(marker);
    });

    marcadores = [];
    document.getElementById("listaMarcacoes").innerHTML = "";
}

function montarPopup(acidente) {
    return `
        <b>${acidente.categoria}</b><br>
        ${acidente.descricao}<br>
        <small>${new Date(acidente.criadoEm).toLocaleString()}</small>
    `;
}

function desenharAcidente(acidente) {
    const marker = L.marker([acidente.lat, acidente.lng], {
        icon: criarIcone(acidente.cor || "gray")
    })
        .addTo(map)
        .bindPopup(montarPopup(acidente));

    marcadores.push(marker);
    adicionarNaLista(acidente);
}

async function renderizarAcidentes() {
    try {
        const acidentes = await buscarAcidentes();
        limparMapaELista();
        acidentes.forEach(desenharAcidente);
    } catch (erro) {
        alert("Nao foi possivel carregar os acidentes: " + erro.message);
    }
}

function abrirModal(acidente) {
    document.getElementById("descricaoAcidente").value = acidente ? acidente.descricao : "";
    document.querySelectorAll(".categoria").forEach(function(btn) {
        const selecionado = acidente && btn.dataset.categoria === acidente.categoria;
        btn.classList.toggle("selecionado", selecionado);
    });

    categoriaSelecionada = acidente ? acidente.categoria : null;
    acidenteEmEdicaoId = acidente ? acidente.id : null;
    coordenadasClique = acidente ? { lat: acidente.lat, lng: acidente.lng } : coordenadasClique;
    document.getElementById("btnConfirmar").textContent = acidente ? "Salvar" : "Confirmar";
    document.getElementById("modal").classList.add("aberto");
}

function fecharModal() {
    document.getElementById("modal").classList.remove("aberto");
    document.getElementById("btnConfirmar").textContent = "Confirmar";
    acidenteEmEdicaoId = null;
}

map.on("click", function(e) {
    coordenadasClique = e.latlng;
    abrirModal(null);
});

document.querySelectorAll(".categoria").forEach(function(btn) {
    btn.addEventListener("click", function() {
        document.querySelectorAll(".categoria").forEach(function(botao) {
            botao.classList.remove("selecionado");
        });

        btn.classList.add("selecionado");
        categoriaSelecionada = btn.dataset.categoria;
    });
});

document.getElementById("btnCancelar").addEventListener("click", fecharModal);

document.getElementById("btnConfirmar").addEventListener("click", async function() {
    const descricao = document.getElementById("descricaoAcidente").value.trim();
    const categoriaAtiva = document.querySelector(".categoria.selecionado");

    if (!categoriaSelecionada || !categoriaAtiva) {
        alert("Selecione uma categoria!");
        return;
    }

    if (descricao === "") {
        alert("Digite uma descricao!");
        return;
    }

    if (!coordenadasClique) {
        alert("Clique no mapa para escolher a localizacao.");
        return;
    }

    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));
    const dadosAcidente = {
        lat: coordenadasClique.lat,
        lng: coordenadasClique.lng,
        descricao: descricao,
        categoria: categoriaSelecionada,
        cor: categoriaAtiva.dataset.cor,
        usuarioId: usuarioLogado && usuarioLogado.id ? usuarioLogado.id : null
    };

    try {
        if (acidenteEmEdicaoId) {
            await atualizarAcidente(acidenteEmEdicaoId, dadosAcidente);
        } else {
            await criarAcidente(dadosAcidente);
        }

        fecharModal();
    } catch (erro) {
        alert("Nao foi possivel salvar: " + erro.message);
    }
});

document.getElementById("btnPainel").addEventListener("click", function() {
    document.getElementById("painel").classList.toggle("aberto");
});

const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

if (usuarioLogado) {
    document.getElementById("perfilNome").textContent = "Usuario: " + usuarioLogado.nome;
    document.getElementById("perfilEmail").textContent = "Email: " + usuarioLogado.email;
}

function adicionarNaLista(acidente) {
    const lista = document.getElementById("listaMarcacoes");
    const item = document.createElement("li");

    item.innerHTML = `
        <div class="marcacao-info">
            <strong>${acidente.categoria}</strong>
            <span>${acidente.descricao}</span>
            <small>${new Date(acidente.criadoEm).toLocaleString()}</small>
        </div>
        <div class="marcacao-acoes">
            <button type="button" class="btn-editar">Editar</button>
            <button type="button" class="btn-excluir">Excluir</button>
        </div>
    `;

    item.querySelector(".marcacao-info").addEventListener("click", function() {
        map.setView([acidente.lat, acidente.lng], 16);
        document.getElementById("painel").classList.remove("aberto");
    });

    item.querySelector(".btn-editar").addEventListener("click", function(event) {
        event.stopPropagation();
        coordenadasClique = { lat: acidente.lat, lng: acidente.lng };
        abrirModal(acidente);
    });

    item.querySelector(".btn-excluir").addEventListener("click", async function(event) {
        event.stopPropagation();

        if (!confirm("Deseja excluir esta ocorrencia?")) {
            return;
        }

        try {
            await excluirAcidente(acidente.id);
        } catch (erro) {
            alert("Nao foi possivel excluir: " + erro.message);
        }
    });

    lista.appendChild(item);
}

const btnLocalizacao = L.control({ position: "bottomright" });

btnLocalizacao.onAdd = function() {
    const btn = L.DomUtil.create("button", "btn-localizacao");
    btn.innerHTML = "Minha localizacao";
    btn.onclick = function(e) {
        L.DomEvent.stopPropagation(e);
        map.locate({ setView: true, maxZoom: 16 });
    };
    return btn;
};

btnLocalizacao.addTo(map);

document.getElementById("btnSair").addEventListener("click", function() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "../Login/Login.html";
});

renderizarAcidentes();
