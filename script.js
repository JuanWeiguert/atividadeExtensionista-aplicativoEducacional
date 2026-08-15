/* ============================================
   script.js
   - Toda a lógica do app (sem backend), usando LocalStorage
   - Módulos:
     1) Autenticação: cadastro, login, sessão
     2) Tarefas: criar (com imagem), listar, excluir
     3) Páginas dinâmicas: atividade.html e livro.html via ?id=
     4) Proteção de rotas: páginas que exigem usuário logado
============================================ */

/* -------------------------
   Utilitários de URL
------------------------- */
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

/* -------------------------
   Sessão e Usuários
------------------------- */
function getUsers() {
  return JSON.parse(localStorage.getItem("users") || "[]");
}
function setUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function getCurrentUser() {
  return localStorage.getItem("currentUser") || null;
}
function requireAuth() {
  // Se a página precisar de usuário logado, chame isso no onload
  if (!getCurrentUser()) {
    alert("Faça login para continuar.");
    window.location.href = "login.html";
  }
}
function login(email, password) {
  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (found) {
    localStorage.setItem("currentUser", email);
    return true;
  }
  return false;
}
function register(email, password) {
  const users = getUsers();
  if (users.some(u => u.email === email)) {
    return { ok: false, msg: "E-mail já cadastrado." };
  }
  users.push({ email, password });        // Obs.: sem criptografia (demo)
  setUsers(users);
  localStorage.setItem("currentUser", email); // mantém logado após cadastro
  return { ok: true };
}
function logout() {
  localStorage.removeItem("currentUser");
}

/* -------------------------
   Tarefas (por usuário)
------------------------- */
function tasksKey() {
  const email = getCurrentUser();
  return `tasks_${email}`;
}
function getTasks() {
  return JSON.parse(localStorage.getItem(tasksKey()) || "[]");
}
function setTasks(tasks) {
  localStorage.setItem(tasksKey(), JSON.stringify(tasks));
}
function addTask({ title, description, imageDataUrl }) {
  const tasks = getTasks();
  tasks.push({
    id: Date.now(),
    title,
    description,
    image: imageDataUrl || null,
    createdAt: new Date().toISOString(),
  });
  setTasks(tasks);
}

/* -------------------------
   Dados estáticos para páginas dinâmicas
------------------------- */
const ACTIVITIES = {
  "sons-letras": {
    title: "Sons das Letras",
    img: "assets/oSomDeCadaLetra.jpg", // TROCADA por imagem exportada
    text:
      "Nas atividades “Sons das Letras”, De forma lúdica e interativa, a criança é estimulada a ouvir os sons de cada letra, associar esses sons a palavras do cotidiano e praticar a leitura inicial. Essa atividade contribui diretamente para a alfabetização e auxilia no processo de reconhecimento das letras e formação das palavras.",
  },
  "ortografia": {
    title: "Ortografia",
    img: "assets/ortografia.jpg",
    text:
      "A atividade “Ortografia” estimula a escrita correta das palavras, ajudando a criança a fixar regras da língua portuguesa de forma prática. Favorece a leitura, a escrita e o desenvolvimento da comunicação.",
  },
  "palavras-cruzadas": {
    title: "Palavras cruzadas",
    img: "assets/palavras-cruzadas.jpg",
    text:
      "A atividade “Palavras Cruzadas” trabalha a atenção e o raciocínio, estimulando a escrita correta das palavras e ampliando o vocabulário de forma divertida.",
  },
  "formando-palavras": {
    title: "Formando palavras",
    img: "assets/formando-palavras.jpg",
    text:
      "A atividade “Formando Palavras” estimula a junção de sílabas e letras, ajudando a criança a construir palavras, desenvolver a leitura e fortalecer o processo de alfabetização.",
  },
};

const BOOKS = {
  "soldadinho-chumbo": {
    title: "O Soldadinho de Chumbo",
    img: "assets/soldadinho.jpg",
    text:
      "O Soldadinho de Chumbo conta a história de um soldadinho sem perna que se apaixona por uma bailarina de papel, mas é separado dela e vive uma série de aventuras até o fim, onde ambos acabam derretendo juntos no fogo, formando um coração de chumbo e lantejoulas.",
  },
  "boas-maneiras": {
    title: "Boas maneiras",
    img: "assets/boas-maneiras.jpg",
    text:
      "Educação, Atitudes, Higiene, Saúde, Segurança, Bons Hábitos são os temas abordados nesta obra lúdica e bem ilustrada, que busca orientar e conscientizar sobre bons comportamentos, por meio de situações cotidianas, possibilitando à criança exercer sua autonomia com segurança.",
  },
  "saber-perder": {
    title: "Saber perder",
    img: "assets/saber-perder.jpg",
    text:
      "Este livro infantil conta a história de Frederico, um jovem nadador que, apesar de todo o seu esforço e treino, perde uma competição nacional e tem de aprender a lidar com a frustração e a decepção. Através da jornada de Frederico, a autora explora os sentimentos complexos que acompanham uma derrota, mostrando que aceitar a perda é o primeiro passo para a superá-la e para o crescimento pessoal, promovendo a resiliência e o autoconhecimento. ",
  },
};

/* -------------------------
   Renderizadores de página
------------------------- */
function renderTasksList() {
  const list = document.getElementById("tasksList");
  if (!list) return;
  const tasks = getTasks();

  list.innerHTML = "";
  if (tasks.length === 0) {
    list.innerHTML = `
      <div class="card center">
        <p>Nenhuma tarefa criada ainda.</p>
        <p class="mt-4"><a class="btn" href="criar.html">Criar primeira tarefa</a></p>
      </div>`;
    return;
  }

  tasks.forEach(t => {
    const item = document.createElement("div");
    item.className = "card task";

    const thumb = t.image
      ? `<img src="${t.image}" alt="imagem da tarefa">`
      : `<img src="assets/placeholder.png" alt="sem imagem">`;

    item.innerHTML = `
      ${thumb}
      <div>
        <h3>${t.title}</h3>
        <p>${t.description || ""}</p>
        <div class="actions">
          <button class="btn-small btn-open" data-id="${t.id}">Abrir tarefa</button>
          <button class="btn-small btn-danger" data-id="${t.id}">Excluir</button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });

 list.addEventListener("click", (e) => {

  // BOTÃO ABRIR TAREFA
  const openBtn = e.target.closest("button.btn-open[data-id]");

  if (openBtn) {
    const id = Number(openBtn.dataset.id);
    window.location.href = `detalhes.html?id=${id}`;
    return;
  }

  // BOTÃO EXCLUIR
  const deleteBtn = e.target.closest("button.btn-danger[data-id]");

  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.id);

    const tasks = getTasks().filter(t => t.id !== id);

    setTasks(tasks);
    renderTasksList();
  }

}, { once: true });

function renderDynamicActivity() {
  const container = document.getElementById("activityContainer");
  if (!container) return;
  const id = getQueryParam("id");
  const data = ACTIVITIES[id];
  if (!data) {
    container.innerHTML = `<p>Atividade não encontrada.</p>`;
    return;
  }
  container.innerHTML = `
  <img src="${data.img}" alt="${data.title}" class="activity-img">
  <h1>${data.title}</h1>
  <p>${data.text}</p>
`;

}

function renderDynamicBook() {
  const container = document.getElementById("bookContainer");
  if (!container) return;
  const id = getQueryParam("id");
  const data = BOOKS[id];
  if (!data) {
    container.innerHTML = `<p>Livro não encontrado.</p>`;
    return;
  }
 container.innerHTML = `
  <img src="${data.img}" alt="${data.title}" class="book-img">
  <h1>${data.title}</h1>
  <p>${data.text}</p>
`;


}

/* -------------------------
   Handlers de formulários
------------------------- */
function attachAuthHandlers() {
  // LOGIN
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;

      if (login(email, password)) {
        window.location.href = "menu.html";
      } else {
        alert("E-mail ou senha incorretos.");
      }
    });
  }

  // CADASTRO
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const confirm  = registerForm.confirm.value;

      if (password !== confirm) {
        alert("As senhas não coincidem.");
        return;
      }
      const res = register(email, password);
      if (!res.ok) {
        alert(res.msg);
        return;
      }
      window.location.href = "menu.html";
    });
  }

  // LOGOUT (se existir botão)
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.href = "index.html";
    });
  }
}

function attachCreateTaskHandler() {
  const form = document.getElementById("createTaskForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const file = form.image.files[0];

    // Converte a imagem para DataURL para salvar no LocalStorage
    const finish = (imageDataUrl) => {
      addTask({ title, description, imageDataUrl });
      alert("Tarefa criada com sucesso!");
      window.location.href = "tarefas.html";
    };

    if (!title) {
      alert("Informe o título da tarefa.");
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => finish(reader.result);
      reader.readAsDataURL(file);
    } else {
      finish(null);
    }
  });
}

function attachHamburgerHandler() {
  const hamburger = document.querySelector(".hamburger");

  if (!hamburger) return;

  hamburger.addEventListener("click", () => {
    window.location.href = "menu.html";
  });
}

/* -------------------------
   Inicialização por página
------------------------- */
document.addEventListener("DOMContentLoaded", () => {

  // Protege páginas que exigem login
  const pagesThatNeedAuth = [
    "menu.html", "criar.html", "tarefas.html",
    "ideias.html", "atividade.html",
    "indicacoes.html", "livro.html",
    "sobre.html", "objetivos.html"
  ];

  const path = location.pathname.split("/").pop();

  if (pagesThatNeedAuth.includes(path)) {
    requireAuth();
  }

  attachAuthHandlers();
  attachCreateTaskHandler();
   // Ativa o botão hambúrguer
  attachHamburgerHandler();
   
  renderTasksList();
  renderDynamicActivity();
  renderDynamicBook();

});
