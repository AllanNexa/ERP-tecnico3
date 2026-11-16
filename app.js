// ===== TechFix — js/app.js =====
const KEY = "techfix.v2";
const ETAPAS = [
  { n: "Recebido",             c: "var(--s0)" },
  { n: "Em diagnóstico",       c: "var(--s1)" },
  { n: "Aguardando peça",      c: "var(--s2)" },
  { n: "Em reparo",            c: "var(--s3)" },
  { n: "Pronto para retirada", c: "var(--s4)" },
  { n: "Entregue",             c: "var(--s5)" }
];

// ---------- Utilidades ----------
const $ = s => document.querySelector(s);
const dia = n => {
  const d = new Date(); d.setDate(d.getDate() + n);
  const p = x => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const fd  = s => new Date(s + "T12:00").toLocaleDateString("pt-BR");
const brl = v => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- Dados ----------
let orders = [
  { id: 1042, cliente: "Marina Duarte",     tel: "(81) 98821-4470", aparelho: "iPhone 12",      defeito: "Tela trincada",     status: 0, valor: 480, prazo: dia(3) },
  { id: 1041, cliente: "Carlos Lima",       tel: "(81) 97712-0034", aparelho: "Notebook Dell",  defeito: "Não liga",          status: 1, valor: 0,   prazo: dia(4) },
  { id: 1040, cliente: "Patrícia Nogueira", tel: "(81) 99105-3321", aparelho: "Galaxy S21",     defeito: "Bateria viciada",   status: 2, valor: 220, prazo: dia(5) },
  { id: 1039, cliente: "Roberto Faria",     tel: "(81) 94433-8890", aparelho: "PlayStation 5",  defeito: "Superaquecimento",  status: 3, valor: 350, prazo: dia(-1) },
  { id: 1038, cliente: "Marina Duarte",     tel: "(81) 98821-4470", aparelho: "MacBook Air",    defeito: "Teclado travando",  status: 3, valor: 690, prazo: dia(2) },
  { id: 1037, cliente: "Estúdio Pixel",     tel: "(81) 3345-9087",  aparelho: "Monitor LG 27”", defeito: "Linhas na imagem",  status: 4, valor: 540, prazo: dia(-2) },
  { id: 1036, cliente: "Juliana Prado",     tel: "(81) 98877-1209", aparelho: "Moto G84",       defeito: "Conector de carga", status: 5, valor: 120, prazo: dia(-6) }
];
try { const s = localStorage.getItem(KEY); if (s) orders = JSON.parse(s); } catch (e) {}
const salvar = () => { try { localStorage.setItem(KEY, JSON.stringify(orders)); } catch (e) {} };

const atrasada = o => o.status < 4 && o.prazo < dia(0);
const pill = s => `<span class="pill" style="--c:${ETAPAS[s].c}">${ETAPAS[s].n}</span>`;

function aviso(msg) {
  const t = $("#toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(aviso.h); aviso.h = setTimeout(() => t.classList.remove("on"), 2200);
}

// ---------- Tela: Painel ----------
function painel() {
  const and = orders.filter(o => o.status < 4).length;
  const pro = orders.filter(o => o.status === 4).length;
  const atr = orders.filter(atrasada).length;
  const val = orders.filter(o => o.status >= 4).reduce((t, o) => t + Number(o.valor), 0);

  const colunas = ETAPAS.slice(0, 5).map((e, i) => {
    const l = orders.filter(o => o.status === i);
    const cards = l.map(o => `
      <button class="tag" style="--c:${e.c}" data-id="${o.id}">
        <span class="id">OS ${o.id}</span>
        <strong>${esc(o.aparelho)}</strong>
        <small>${esc(o.cliente)}</small>
        <small${atrasada(o) ? ' style="color:var(--warn);font-weight:600"' : ""}>${atrasada(o) ? "Atrasada · " : "Prazo "}${fd(o.prazo)}</small>
      </button>`).join("");
    return `<section class="col" style="--c:${e.c}">
      <h3>${e.n} <span class="count">${l.length}</span></h3>
      ${cards || '<p class="sub">Nenhum aparelho aqui.</p>'}</section>`;
  }).join("");

  return `
    <div class="top"><div><h1>Painel da bancada</h1>
      <p class="sub">Toque em uma ordem para ver detalhes ou avançar a etapa.</p></div></div>
    <section class="stats">
      <div class="stat"><b>${and}</b><span>Em andamento</span></div>
      <div class="stat"><b>${pro}</b><span>Prontas para retirada</span></div>
      <div class="stat late"><b>${atr}</b><span>Com prazo vencido</span></div>
      <div class="stat"><b>${brl(val)}</b><span>Prontas + entregues</span></div>
    </section>
    <div class="board">${colunas}</div>`;
}

// ---------- Tela: Ordens ----------
let busca = "", filtro = "all";

function ordens() {
  return `
    <div class="top"><div><h1>Ordens de serviço</h1>
      <p class="sub">${orders.length} ordens registradas</p></div></div>
    <div class="tools">
      <input id="q" type="search" placeholder="Buscar por cliente, aparelho ou número" aria-label="Buscar">
      <select id="fs" aria-label="Filtrar por status">
        <option value="all">Todos os status</option>
        ${ETAPAS.map((e, i) => `<option value="${i}">${e.n}</option>`).join("")}
      </select>
    </div>
    <div class="tw">
      <table><thead><tr><th>OS</th><th>Cliente</th><th>Aparelho</th><th>Status</th><th>Prazo</th><th class="r">Valor</th></tr></thead>
      <tbody id="tb"></tbody></table>
      <p class="empty" id="vazio" hidden>Nenhuma ordem encontrada. Ajuste a busca ou o filtro.</p>
    </div>`;
}

function ligaOrdens() {
  const q = $("#q"), f = $("#fs");
  q.value = busca; f.value = filtro;
  const tabela = () => {
    busca = q.value; filtro = f.value;
    const t = busca.toLowerCase();
    const l = orders.filter(o => (filtro === "all" || o.status === +filtro) &&
      `${o.id} ${o.cliente} ${o.aparelho}`.toLowerCase().includes(t));
    $("#tb").innerHTML = l.map(o => `
      <tr tabindex="0" data-id="${o.id}"><td>${o.id}</td><td>${esc(o.cliente)}</td><td>${esc(o.aparelho)}</td>
      <td>${pill(o.status)}</td><td>${fd(o.prazo)}</td><td class="r">${o.valor ? brl(o.valor) : "A orçar"}</td></tr>`).join("");
    $("#vazio").hidden = l.length > 0;
  };
  q.oninput = tabela; f.onchange = tabela; tabela();
}

// ---------- Tela: Clientes ----------
function clientes() {
  const m = {};
  orders.forEach(o => {
    const c = m[o.cliente] ??= { nome: o.cliente, tel: o.tel, n: 0, aberto: 0, total: 0 };
    c.n++; c.total += Number(o.valor); if (o.status < 5) c.aberto++;
  });
  const l = Object.values(m).sort((a, b) => b.n - a.n);
  return `
    <div class="top"><div><h1>Clientes</h1>
      <p class="sub">${l.length} clientes. Clique em um cliente para ver as ordens dele.</p></div></div>
    <div class="tw"><table>
      <thead><tr><th>Cliente</th><th>Telefone</th><th class="r">Ordens</th><th class="r">Em aberto</th><th class="r">Total gasto</th></tr></thead>
      <tbody>${l.map(c => `
        <tr data-nome="${esc(c.nome)}"><td><strong>${esc(c.nome)}</strong></td><td>${esc(c.tel || "—")}</td>
        <td class="r">${c.n}</td><td class="r">${c.aberto}</td><td class="r">${brl(c.total)}</td></tr>`).join("")}
      </tbody></table></div>`;
}

// ---------- Navegação ----------
const TELAS = { painel, ordens, clientes };

function render() {
  const t = (location.hash || "#painel").slice(1);
  const tela = TELAS[t] ? t : "painel";
  document.querySelectorAll("nav a").forEach(a => {
    if (a.hash === "#" + tela) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  $("#view").innerHTML = TELAS[tela]();
  if (tela === "ordens") ligaOrdens();
}

// ---------- Janelas ----------
function abrir(html) {
  const d = $("#dlg");
  d.innerHTML = html;
  d.showModal();
  d.querySelectorAll("[data-fechar]").forEach(b => b.onclick = () => d.close());
  return d;
}

function detalhes(id) {
  const o = orders.find(x => x.id === id);
  const prox = o.status === 4 ? "Marcar como entregue" : o.status < 4 ? `Mover para ${ETAPAS[o.status + 1].n}` : "";
  const d = abrir(`
    <div class="dh"><div><h2>OS ${o.id} · ${esc(o.aparelho)}</h2>${pill(o.status)}</div>
      <button class="x" aria-label="Fechar" data-fechar>×</button></div>
    <div class="db" style="--c:${ETAPAS[o.status].c}">
      <div class="steps" aria-hidden="true">${ETAPAS.map((_, i) => `<i class="${i <= o.status ? "on" : ""}"></i>`).join("")}</div>
      <dl><dt>Cliente</dt><dd>${esc(o.cliente)}</dd>
        <dt>Telefone</dt><dd>${esc(o.tel || "—")}</dd>
        <dt>Defeito</dt><dd>${esc(o.defeito || "—")}</dd>
        <dt>Prazo</dt><dd>${fd(o.prazo)}${atrasada(o) ? ' <b style="color:var(--warn)">(atrasada)</b>' : ""}</dd></dl>
      <label>Valor do serviço (R$)<input type="number" min="0" step="10" id="vl" value="${o.valor || ""}" placeholder="Ainda sem orçamento"></label>
    </div>
    <div class="df">
      <button class="btn sec" data-fechar>Fechar</button>
      <button class="btn sec" id="sv">Salvar valor</button>
      ${prox ? `<button class="btn" id="av">${prox}</button>` : ""}
    </div>`);

  $("#sv").onclick = () => { o.valor = +$("#vl").value || 0; salvar(); d.close(); render(); aviso("Valor salvo"); };
  const av = $("#av");
  if (av) av.onclick = () => {
    o.valor = +$("#vl").value || o.valor;
    o.status++; salvar(); d.close(); render();
    aviso(`OS ${o.id}: ${ETAPAS[o.status].n}`);
  };
}

function novaOrdem() {
  const d = abrir(`
    <form id="form" style="display:contents">
      <div class="dh"><h2>Nova ordem de serviço</h2>
        <button type="button" class="x" aria-label="Fechar" data-fechar>×</button></div>
      <div class="db">
        <div class="g2">
          <label>Cliente<input name="cliente" required autocomplete="off"></label>
          <label>Telefone<input name="tel" required inputmode="tel" placeholder="(81) 90000-0000"></label>
        </div>
        <label>Aparelho<input name="aparelho" required placeholder="Ex.: iPhone 12, Notebook Dell"></label>
        <label>Defeito relatado<textarea name="defeito" rows="3" required></textarea></label>
        <div class="g2">
          <label>Prazo<input type="date" name="prazo" required value="${dia(5)}"></label>
          <label>Valor estimado (R$)<input type="number" name="valor" min="0" step="10"></label>
        </div>
      </div>
      <div class="df">
        <button type="button" class="btn sec" data-fechar>Cancelar</button>
        <button class="btn">Abrir ordem</button>
      </div>
    </form>`);

  $("#form").onsubmit = e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const id = Math.max(1000, ...orders.map(o => o.id)) + 1;
    orders.unshift({ id, cliente: f.cliente.trim(), tel: f.tel.trim(), aparelho: f.aparelho.trim(),
      defeito: f.defeito.trim(), status: 0, valor: Number(f.valor) || 0, prazo: f.prazo });
    salvar(); d.close(); render(); aviso(`OS ${id} aberta`);
  };
}

// ---------- Eventos ----------
$("#view").addEventListener("click", e => {
  const o = e.target.closest("[data-id]");
  if (o) return detalhes(+o.dataset.id);
  const c = e.target.closest("[data-nome]");
  if (c) { busca = c.dataset.nome; filtro = "all"; location.hash = "#ordens"; }
});
$("#view").addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const t = e.target.closest("tr[data-id]");
  if (t) detalhes(+t.dataset.id);
});
$("#novaOrdem").addEventListener("click", novaOrdem);
addEventListener("hashchange", render);

render();
