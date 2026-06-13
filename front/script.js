let tempoEspera;
let fuse;
let produtosAtuais = [];

const inputBusca = document.getElementById('inputBusca');
const listaProdutos = document.getElementById('listaProdutos');
const loader = document.getElementById('loader');
const mensagemErro = document.getElementById('mensagemErro');

const OPENFDA_URL = 'https://api.fda.gov/drug/label.json';
const LIMITE_RESULTADOS = 20;

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
        buscarOpenFda(termoDigitado);
    }, 300);
});

async function buscarOpenFda(termo) {
    const query = `openfda.brand_name:\"${termo}\" OR openfda.generic_name:\"${termo}\" OR openfda.manufacturer_name:\"${termo}\"`;
    const url = `${OPENFDA_URL}?search=${encodeURIComponent(query)}&limit=${LIMITE_RESULTADOS}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao buscar dados do openFDA.');

        const dados = await response.json();
        const resultados = Array.isArray(dados.results)
            ? dados.results
            : Array.isArray(dados.resultados)
                ? dados.resultados
                : [];

        produtosAtuais = resultados
            .map(item => ({
                nome: getNome(item),
                principioAtivo: getPrincipioAtivo(item),
                razaoSocial: getFabricante(item),
                raw: item
            }))
            .filter(produto => produto.nome || produto.principioAtivo);

        if (!produtosAtuais.length) {
            loader.classList.add('hidden');
            mostrarErro();
            return;
        }

        fuse = new Fuse(produtosAtuais, {
            keys: ['nome', 'principioAtivo', 'razaoSocial'],
            threshold: 0.4,
            minMatchCharLength: 2,
            includeScore: true
        });

        executarBuscaFuzzy(termo);
    } catch (erro) {
        console.error('Erro ao buscar openFDA:', erro);
        loader.classList.add('hidden');
        mensagemErro.textContent = 'Não foi possível buscar os dados. Tente novamente.';
        mensagemErro.classList.remove('hidden');
    }
}

function executarBuscaFuzzy(termo) {
    if (!fuse || !produtosAtuais.length) {
        loader.classList.add('hidden');
        mostrarErro();
        return;
    }

    const resultadosFuse = fuse.search(termo);
    const remediosFiltrados = resultadosFuse.length
        ? resultadosFuse.map(resultado => resultado.item)
        : produtosAtuais;

    loader.classList.add('hidden');
    renderizarResultados(remediosFiltrados);
}

function renderizarResultados(remedios) {
    listaProdutos.innerHTML = '';

    if (remedios.length === 0) {
        mostrarErro();
        return;
    }

    mensagemErro.classList.add('hidden');
    listaProdutos.classList.remove('hidden');

    remedios.forEach(remedio => {
        const li = document.createElement('li');

        li.innerHTML = `
            <span class="med-title">${remedio.nome || 'Sem nome'}</span>
            <div class="med-detalhes">
                <span><strong>Princípio Ativo:</strong> ${remedio.principioAtivo || 'Não informado'}</span> |
                <span><strong>Empresa:</strong> ${remedio.razaoSocial || 'Não informado'}</span>
            </div>
        `;

        li.addEventListener('click', () => {
            const dados = remedio.raw;
            const detalhe = `Nome: ${remedio.nome || 'N/A'}\n` +
                `Princípio Ativo: ${remedio.principioAtivo || 'N/A'}\n` +
                `Empresa: ${remedio.razaoSocial || 'N/A'}\n` +
                `NDC: ${dados.openfda?.product_ndc?.[0] || 'N/A'}`;
            alert(detalhe);
        });

        listaProdutos.appendChild(li);
    });
}

function mostrarErro() {
    listaProdutos.classList.add('hidden');
    mensagemErro.classList.remove('hidden');
}

function esconderElementos() {
    listaProdutos.classList.add('hidden');
    mensagemErro.classList.add('hidden');
    loader.classList.add('hidden');
}

function getNome(item) {
    return item.openfda?.brand_name?.[0]
        || item.openfda?.generic_name?.[0]
        || item.openfda?.manufacturer_name?.[0]
        || item.openfda?.nome_da_marca?.[0]
        || item.nome
        || '';
}

function getPrincipioAtivo(item) {
    return item.openfda?.substance_name?.[0]
        || item.openfda?.nome_da_substância?.[0]
        || item.ingrediente_ativo?.[0]
        || item.ingrediente_inativo?.[0]
        || '';
}

function getFabricante(item) {
    return item.openfda?.manufacturer_name?.[0]
        || item.openfda?.nome_do_fabricante?.[0]
        || item.razaoSocial
        || '';
}
