const API_URL = "../api/acidentes";

const incidentColors = {
    Roubo: "#ef4444",
    Vandalismo: "#f97316",
    Furto: "#facc15",
    Assalto: "#dc2626",
    Acidente: "#38bdf8",
    Batida: "#ef4444",
    Atropelamento: "#f97316",
    "Buraco na via": "#facc15",
    Alagamento: "#38bdf8",
    Incendio: "#8b5cf6",
    "Incêndio": "#8b5cf6"
};

let selectedLocation = null;
let markers = [];
let heatLayer = null;
let dashboardHeatLayer = null;
let regionChart = null;
let incidentChart = null;
let responseChart = null;

const map = L.map("map").setView([-23.5505, -46.6333], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(map);

L.Control.geocoder({
    defaultMarkGeocode: true,
    position: "topright"
}).addTo(map);

const dashboardHeatMap = L.map("dashboardHeatMap", {
    zoomControl: true
}).setView([-23.5505, -46.6333], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "OpenStreetMap"
}).addTo(dashboardHeatMap);

map.on("click", function(event) {
    selectedLocation = event.latlng;
    alert("Localizacao selecionada. Agora preencha os dados e clique em Adicionar ao Mapa.");
});

document.getElementById("addIncidentBtn").addEventListener("click", async function() {
    const tipo = document.getElementById("incidentType").value;
    const descricao = document.getElementById("incidentDescription").value.trim();
    const usuarioLogado = JSON.parse(localStorage.getItem("usuarioLogado"));

    if (!selectedLocation) {
        alert("Clique no mapa para selecionar a localizacao.");
        return;
    }

    if (descricao === "") {
        alert("Digite uma descricao.");
        return;
    }

    try {
        await chamarApi(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lat: selectedLocation.lat,
                lng: selectedLocation.lng,
                descricao,
                categoria: tipo,
                cor: incidentColors[tipo] || "#64748b",
                usuarioId: usuarioLogado && usuarioLogado.id ? usuarioLogado.id : null
            })
        });

        document.getElementById("incidentDescription").value = "";
        selectedLocation = null;
        await carregarDashboard();
    } catch (erro) {
        alert("Nao foi possivel salvar: " + erro.message);
    }
});

async function chamarApi(url, opcoes) {
    const resposta = await fetch(url, opcoes);
    const dados = await resposta.json();

    if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao acessar a API.");
    }

    return dados;
}

async function carregarDashboard() {
    try {
        const dados = await chamarApi(API_URL);
        const acidentes = dados.acidentes || [];

        atualizarContadores(acidentes);
        atualizarMapa(acidentes);
        atualizarMapaDeCalor(acidentes);
        atualizarGraficos(acidentes);
        atualizarHeatmap(acidentes);
    } catch (erro) {
        alert("Nao foi possivel carregar o dashboard: " + erro.message);
    }
}

function atualizarContadores(acidentes) {
    const tipos = contarPorCampo(acidentes, "categoria");

    document.getElementById("totalOccurrences").textContent = acidentes.length;
    document.getElementById("registeredCount").textContent = acidentes.length;

    const typeStats = document.getElementById("typeStats");
    typeStats.innerHTML = "";

    if (Object.keys(tipos).length === 0) {
        typeStats.textContent = "Nenhum incidente registrado.";
        return;
    }

    Object.entries(tipos).forEach(function([tipo, total]) {
        const linha = document.createElement("p");
        linha.innerHTML = `<span class="${classeTipo(tipo)}">${tipo}</span>: ${total}`;
        typeStats.appendChild(linha);
    });
}

function atualizarMapa(acidentes) {
    markers.forEach(function(marker) {
        map.removeLayer(marker);
    });
    markers = [];

    if (heatLayer) {
        map.removeLayer(heatLayer);
        heatLayer = null;
    }

    const heatPoints = [];

    acidentes.forEach(function(acidente) {
        const marker = L.marker([acidente.lat, acidente.lng])
            .addTo(map)
            .bindPopup(`
                <b>${acidente.categoria}</b><br>
                ${acidente.descricao}<br>
                <small>${formatarData(acidente.criadoEm)}</small>
            `);

        markers.push(marker);
        heatPoints.push([acidente.lat, acidente.lng, 0.6]);
    });

    if (heatPoints.length > 0 && L.heatLayer) {
        heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 18
        }).addTo(map);
    }
}

function atualizarMapaDeCalor(acidentes) {
    if (dashboardHeatLayer) {
        dashboardHeatMap.removeLayer(dashboardHeatLayer);
        dashboardHeatLayer = null;
    }

    const pontos = acidentes.map(function(acidente) {
        return [acidente.lat, acidente.lng, 0.75];
    });

    if (pontos.length === 0 || !L.heatLayer) {
        dashboardHeatMap.setView([-23.5505, -46.6333], 12);
        return;
    }

    dashboardHeatLayer = L.heatLayer(pontos, {
        radius: 35,
        blur: 24,
        maxZoom: 17,
        gradient: {
            0.2: "#38bdf8",
            0.45: "#22c55e",
            0.7: "#facc15",
            1.0: "#ef4444"
        }
    }).addTo(dashboardHeatMap);

    if (acidentes.length === 1) {
        dashboardHeatMap.setView([acidentes[0].lat, acidentes[0].lng], 14);
        return;
    }

    const bounds = L.latLngBounds(acidentes.map(function(acidente) {
        return [acidente.lat, acidente.lng];
    }));

    dashboardHeatMap.fitBounds(bounds.pad(0.2));
}

function atualizarGraficos(acidentes) {
    const tipos = contarPorCampo(acidentes, "categoria");
    const regioes = contarPorRegiao(acidentes);

    regionChart = recriarGrafico(regionChart, "regionChart", "bar", {
        labels: Object.keys(regioes),
        datasets: [{
            label: "Ocorrencias",
            data: Object.values(regioes),
            backgroundColor: "#38bdf8"
        }]
    });

    incidentChart = recriarGrafico(incidentChart, "incidentChart", "doughnut", {
        labels: Object.keys(tipos),
        datasets: [{
            data: Object.values(tipos),
            backgroundColor: Object.keys(tipos).map(function(tipo) {
                return incidentColors[tipo] || "#64748b";
            })
        }]
    });

    responseChart = recriarGrafico(responseChart, "responseChart", "line", {
        labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
        datasets: [{
            label: "Minutos",
            data: [12, 11, 10, 9, 9],
            borderColor: "#22c55e",
            backgroundColor: "rgba(34, 197, 94, 0.2)",
            tension: 0.35,
            fill: true
        }]
    });

    const maiorTipo = Object.entries(tipos).sort(function(a, b) {
        return b[1] - a[1];
    })[0];

    document.getElementById("insightBox").textContent = maiorTipo
        ? `Tipo mais registrado: ${maiorTipo[0]} (${maiorTipo[1]} ocorrencias).`
        : "Ainda nao ha dados suficientes para gerar insights.";
}

function recriarGrafico(graficoAtual, canvasId, tipo, data) {
    if (graficoAtual) {
        graficoAtual.destroy();
    }

    return new Chart(document.getElementById(canvasId), {
        type: tipo,
        data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: {
                        color: "#e2e8f0"
                    }
                }
            },
            scales: tipo === "doughnut" ? {} : {
                x: {
                    ticks: { color: "#e2e8f0" },
                    grid: { color: "rgba(255,255,255,0.08)" }
                },
                y: {
                    beginAtZero: true,
                    ticks: { color: "#e2e8f0", precision: 0 },
                    grid: { color: "rgba(255,255,255,0.08)" }
                }
            }
        }
    });
}

function atualizarHeatmap(acidentes) {
    const regioes = contarPorRegiao(acidentes);
    const container = document.getElementById("heatmapContainer");
    const maiorTotal = Math.max(...Object.values(regioes), 1);

    container.innerHTML = "";

    if (acidentes.length === 0) {
        container.textContent = "Nenhuma area com ocorrencia registrada.";
        return;
    }

    Object.entries(regioes).forEach(function([regiao, total]) {
        const percentual = Math.round((total / maiorTotal) * 100);
        const item = document.createElement("div");
        item.className = "heatmap-item";
        item.innerHTML = `
            <div class="heatmap-info">
                <div class="heatmap-header">
                    <span class="heatmap-area">${regiao}</span>
                    <span class="heatmap-count">${total}</span>
                </div>
                <div class="heatmap-bar-container">
                    <div class="heatmap-bar" style="width: ${percentual}%; background: #38bdf8;"></div>
                    <div class="heatmap-bar-label">${percentual}%</div>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
}

function contarPorCampo(lista, campo) {
    return lista.reduce(function(contagem, item) {
        const valor = item[campo] || "Nao informado";
        contagem[valor] = (contagem[valor] || 0) + 1;
        return contagem;
    }, {});
}

function contarPorRegiao(acidentes) {
    return acidentes.reduce(function(contagem, acidente) {
        const regiao = obterRegiao(acidente.lat, acidente.lng);
        contagem[regiao] = (contagem[regiao] || 0) + 1;
        return contagem;
    }, {});
}

function obterRegiao(lat, lng) {
    if (lat < -23.6) {
        return "Zona Sul";
    }

    if (lat > -23.52) {
        return "Zona Norte";
    }

    if (lng < -46.68) {
        return "Zona Oeste";
    }

    if (lng > -46.58) {
        return "Zona Leste";
    }

    return "Centro";
}

function formatarData(data) {
    if (!data) {
        return "";
    }

    return new Date(data).toLocaleString("pt-BR");
}

function classeTipo(tipo) {
    return "tipo-" + tipo
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");
}

carregarDashboard();
