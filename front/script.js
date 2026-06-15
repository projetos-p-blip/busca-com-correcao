let tempoEspera;
let produtosAtuais = [];
let selecionados = [];

const inputBusca = document.getElementById('inputBusca');
const listaProdutos = document.getElementById('listaProdutos');
const listaSelecionados = document.getElementById('listaSelecionados');
const mensagemErro = document.getElementById('mensagemErro');
const mensagemVazio = document.getElementById('mensagemVazio');
const loader = document.getElementById('loader');

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
            mostrarErro('Nenhum dado válido encontrado em convertcsv.json.');
            return;
        }
    } catch (erro) {
        console.error('Erro ao carregar dados locais:', erro);
        mostrarErro('Não foi possível carregar os dados locais. Verifique se convertcsv.json está disponível.');
    }
}

function buscarLocal(termo) {
    const termoLower = termo.toLowerCase();
    const resultados = produtosAtuais.filter(item => {
        const campos = [item.A, item.B, item.C, item.G, item.D, item.E, item.H, item.I];
        return campos.some(campo => campo && campo.toString().toLowerCase().includes(termoLower));
    });

    loader.classList.add('hidden');
    renderizarResultados(resultados.slice(0, LIMITE_RESULTADOS));
}

function renderizarResultados(remedios) {
    listaProdutos.innerHTML = '';

    if (!remedios.length) {
        mostrarErro('Nenhum medicamento encontrado.');
        return;
    }

    mensagemErro.classList.add('hidden');
    listaProdutos.classList.remove('hidden');

    remedios.forEach(remedio => {
        const li = document.createElement('li');
        const nomeCompleto = `${remedio.A || ''}${remedio.B ? ' - ' + remedio.B : ''}`.trim();
        
        if (remedio.H === "ativo"){
            remedio.H.classList.add('ativo');
        } else if (remedio.H === "inativo"){
            li.classList.add('inativo');
        }

        li.classList.add(getStatusClass(remedio.H));
        li.innerHTML = `
            <span class="med-title">${nomeCompleto || 'Sem nome'}</span>
            <div class="med-detalhes"><strong>Princípio Ativo:</strong> ${remedio.C || 'Não informado'}</div>
            <div class="med-detalhes"><strong>Empresa:</strong> ${remedio.G || 'Não informado'}</div>
        `;

        li.addEventListener('click', () => {
            abrirModal(remedio, nomeCompleto);
        });

        listaProdutos.appendChild(li);
    });
}

function getStatusClass(status) {
    if (!status) return 'desconhecido';
    const valor = status.toString().toLowerCase();
    if (valor.includes('ativo')) return 'ativo';
    if (valor.includes('inativo')) return 'inativo';
    return 'desconhecido';
}

function abrirModal(remedio, nomeCompleto) {
    const jaSelecionado = selecionados.some(item => item.A === remedio.A && item.E === remedio.E);
    const modal = document.createElement('div');
    modal.className = 'modal show';

    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" type="button" aria-label="Fechar">×</button>
            <h2>${nomeCompleto || 'Nome indisponível'}</h2>
            <p><strong>Princípio Ativo:</strong> ${remedio.C || 'Não informado'}</p>
            <p><strong>Empresa:</strong> ${remedio.G || 'Não informado'}</p>
            <p><strong>Tipo de Regularização:</strong> ${remedio.D || 'N/A'}</p>
            <p><strong>Nº Regularização:</strong> ${remedio.E || 'N/A'}</p>
            <p><strong>Processo:</strong> ${remedio.F || 'N/A'}</p>
            <p><strong>Situação:</strong> ${remedio.H || 'N/A'}</p>
            <p><strong>Vencimento:</strong> ${remedio.I || 'N/A'}</p>
            <div class="modal-button-container">
                <button class="btn-adicionar-modal" ${jaSelecionado ? 'disabled' : ''}>${jaSelecionado ? '✓ Adicionado' : 'Adicionar'}</button>
                <button class="btn-fechar-modal" type="button">Fechar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const btnAdicionar = modal.querySelector('.btn-adicionar-modal');
    const btnFechar = modal.querySelector('.btn-fechar-modal');
    const btnClose = modal.querySelector('.modal-close');

    function fecharModal() {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 250);
    }

    if (!jaSelecionado) {
        btnAdicionar.addEventListener('click', () => {
            adicionarSelecionado(remedio);
            fecharModal();
        });
    }

    btnFechar.addEventListener('click', fecharModal);
    btnClose.addEventListener('click', fecharModal);

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            fecharModal();
        }
    });
}

function adicionarSelecionado(remedio) {
    const jaSelecionado = selecionados.some(item => item.A === remedio.A && item.E === remedio.E);
    if (jaSelecionado) return;

    selecionados.push(remedio);
    renderizarSelecionados();
}

function removerSelecionado(index) {
    selecionados.splice(index, 1);
    renderizarSelecionados();
}

function renderizarSelecionados() {
    listaSelecionados.innerHTML = '';

    if (selecionados.length === 0) {
        mensagemVazio.classList.remove('hidden');
        return;
    }

    mensagemVazio.classList.add('hidden');

    selecionados.forEach((remedio, index) => {
        const nomeCompleto = `${remedio.A || ''}${remedio.B ? ' - ' + remedio.B : ''}`.trim();
        const li = document.createElement('li');

        li.innerHTML = `
            <div class="selected-item-info">
                <span class="med-title">${nomeCompleto || 'Sem nome'}</span>
                <div class="med-detalhes"><strong>Princípio Ativo:</strong> ${remedio.C || 'Não informado'}</div>
                <div class="med-detalhes"><strong>Empresa:</strong> ${remedio.G || 'Não informado'}</div>
            </div>
            <button class="btn-remover" type="button">Remover</button>
        `;

        li.querySelector('.btn-remover').addEventListener('click', () => {
            removerSelecionado(index);
        });

        listaSelecionados.appendChild(li);
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
