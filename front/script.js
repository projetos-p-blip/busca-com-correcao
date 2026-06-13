let tempoEspera;
let fuse;
let produtosAtuais = [];

const inputBusca = document.getElementById('inputBusca');
const listaProdutos = document.getElementById('listaProdutos');
const loader = document.getElementById('loader');
const mensagemErro = document.getElementById('mensagemErro');

const DADOS_LOCAL = '../convertcsv.json';
const LIMITE_RESULTADOS = 100;

window.addEventListener('DOMContentLoaded', carregarDadosLocais);
inputBusca.addEventListener('input', (evento) => {
    clearTimeout(tempoEspera);

    const termoDigitado = evento.target.value.trim();

    if (termoDigitado.length === 0) {
        esconderElementos();
        return;
    }

    loader.classList.remove('hidden');
    mensagemErro.classList.add('hidden');

    tempoEspera = setTimeout(() => {
        buscarLocal(termoDigitado);
    }, 300);
});

async function carregarDadosLocais() {
    try {
        const response = await fetch(DADOS_LOCAL);
        if (!response.ok) throw new Error('Erro ao carregar convertcsv.json');

        const dados = await response.json();
        produtosAtuais = Array.isArray(dados)
            ? dados.filter(item => item && item.A && item.A !== 'Nome do Produto')
            : [];

        if (!produtosAtuais.length) {
            mensagemErro.textContent = 'Nenhum dado válido encontrado em convertcsv.json.';
            mensagemErro.classList.remove('hidden');
            return;
        }

        fuse = new Fuse(produtosAtuais, {
            keys: ['A', 'B', 'C', 'G', 'D', 'E', 'H', 'I'],
            threshold: 0.4,
            minMatchCharLength: 2,
            includeScore: true
        });
    } catch (erro) {
        console.error('Erro ao carregar dados locais:', erro);
        mensagemErro.textContent = 'Não foi possível carregar os dados locais. Verifique se convertcsv.json está disponível.';
        mensagemErro.classList.remove('hidden');
    }
}

function buscarLocal(termo) {
    if (!fuse || !produtosAtuais.length) {
        loader.classList.add('hidden');
        mostrarErro('Dados não carregados.');
        return;
    }

    const resultadosFuse = fuse.search(termo);
    const remediosFiltrados = resultadosFuse.length
        ? resultadosFuse.map(resultado => resultado.item)
        : produtosAtuais;

    loader.classList.add('hidden');
    renderizarResultados(remediosFiltrados.slice(0, LIMITE_RESULTADOS));
}

function renderizarResultados(remedios) {
    listaProdutos.innerHTML = '';

    if (remedios.length === 0) {
        mostrarErro('Nenhum medicamento encontrado.');
        return;
    }

    mensagemErro.classList.add('hidden');
    listaProdutos.classList.remove('hidden');

    remedios.forEach(remedio => {
        const li = document.createElement('li');
        const nomeCompleto = `${remedio.A || ''}${remedio.B ? ' - ' + remedio.B : ''}`.trim();

        li.innerHTML = `
            <span class="med-title">${nomeCompleto || 'Sem nome'}</span>
            <div class="med-detalhes">
                <span><strong>Princípio Ativo:</strong> ${remedio.C || 'Não informado'}</span> |
                <span><strong>Empresa:</strong> ${remedio.G || 'Não informado'}</span>
            </div>
            <div class="med-detalhes">
                <span><strong>Tipo de Regularização:</strong> ${remedio.D || 'N/A'}</span> |
                <span><strong>Nº Regularização:</strong> ${remedio.E || 'N/A'}</span>
            </div>
            <div class="med-detalhes">
                <span><strong>Processo:</strong> ${remedio.F || 'N/A'}</span> |
                <span><strong>Vencimento:</strong> ${remedio.I || 'N/A'}</span>
            </div>
        `;

        li.addEventListener('click', () => {
            alert(
                `Nome: ${nomeCompleto || 'N/A'}\n` +
                `Princípio Ativo: ${remedio.C || 'N/A'}\n` +
                `Empresa: ${remedio.G || 'N/A'}\n` +
                `Tipo de Regularização: ${remedio.D || 'N/A'}\n` +
                `Nº Regularização: ${remedio.E || 'N/A'}\n` +
                `Processo: ${remedio.F || 'N/A'}\n` +
                `Situação: ${remedio.H || 'N/A'}\n` +
                `Vencimento: ${remedio.I || 'N/A'}`
            );
        });

        listaProdutos.appendChild(li);
    });
}

function mostrarErro(texto = 'Nenhum medicamento encontrado.') {
    listaProdutos.classList.add('hidden');
    mensagemErro.textContent = texto;
    mensagemErro.classList.remove('hidden');
}

function esconderElementos() {
    listaProdutos.classList.add('hidden');
    mensagemErro.classList.add('hidden');
    loader.classList.add('hidden');
}
