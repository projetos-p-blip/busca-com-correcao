let tempoEspera;
let todosProdutos = []; // Vai guardar a lista completa de remédios carregada do JSON

const inputBusca = document.getElementById('inputBusca');
const listaProdutos = document.getElementById('listaProdutos');
const loader = document.getElementById('loader');
const mensagemErro = document.getElementById('mensagemErro');

let fuse;

// 1. CARREGAR OS DADOS DO REMEDIOS.JSON assim que a página abre
fetch('../remedios.json')
    .then(response => {
        if (!response.ok) throw new Error('Não foi possível carregar o arquivo JSON.');
        return response.json();
    })
    .then(dados => {
        todosProdutos = dados;

        const opcoesFuse = {
            keys: ['nome', 'principioAtivo'],
            threshold: 0.35,
            minMatchCharLength: 2,
            includeScore: true
        };

        fuse = new Fuse(todosProdutos, opcoesFuse);
    })
    .catch(erro => {
        console.error('Erro ao inicializar banco de dados local:', erro);
        mensagemErro.textContent = 'Ocorreu um erro ao carregar os dados.';
        mensagemErro.classList.remove('hidden');
    });


// 2. SISTEMA DE DEBOUNCE (Monitora o teclado do usuário)
inputBusca.addEventListener('keyup', (evento) => {
    clearTimeout(tempoEspera); // Cancela o cronômetro anterior se o usuário continuar digitando

    const termoDigitado = evento.target.value.trim();

    // Se o usuário apagar o campo de texto, limpa a tela
    if (termoDigitado.length === 0) {
        esconderElementos();
        return;
    }

    // Só faz a busca se tiver pelo menos 3 caracteres digitados
    if (termoDigitado.length >= 3) {
        loader.classList.remove('hidden');
        mensagemErro.classList.add('hidden');

        // Aguarda 300ms após a última tecla para processar a busca
        tempoEspera = setTimeout(() => {
            executarBuscaFuzzy(termoDigitado);
        }, 300);
    }
});


// 3. BUSCA FUZZY COM FUSE.JS
function executarBuscaFuzzy(termo) {
    if (!fuse) {
        loader.classList.add('hidden');
        return;
    }

    const resultados = fuse.search(termo);
    const remediosFiltrados = resultados.map(resultado => resultado.item);

    // Se não encontrar nada com fuzzy matching, tenta uma busca simples por includes.
    if (!remediosFiltrados.length) {
        const termoMinusculo = termo.toLowerCase();
        remediosFiltrados.push(...todosProdutos.filter(remedio => {
            const nome = remedio.nome.toLowerCase();
            const principio = remedio.principioAtivo.toLowerCase();
            return nome.includes(termoMinusculo) || principio.includes(termoMinusculo);
        }));
    }

    loader.classList.add('hidden');
    renderizarResultados(remediosFiltrados);
}


// 4. RENDERIZAR OS RESULTADOS NO HTML
function renderizarResultados(remedios) {
    listaProdutos.innerHTML = ''; // Limpa os resultados anteriores

    if (remedios.length === 0) {
        mostrarErro();
        return;
    }

    mensagemErro.classList.add('hidden');
    listaProdutos.classList.remove('hidden');

    // Cria os elementos HTML para cada remédio encontrado
    remedios.forEach(remedio => {
        const li = document.createElement('li');
        
        li.innerHTML = `
            <span class="med-title">${remedio.nome}</span>
            <div class="med-detalhes">
                <span><strong>Princípio Ativo:</strong> ${remedio.principioAtivo}</span> | 
                <span><strong>Empresa:</strong> ${remedio.razaoSocial}</span>
            </div>
        `;

        // Evento de clique no remédio da lista
        li.addEventListener('click', () => {
            alert(`Você selecionou: ${remedio.nome}`);
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