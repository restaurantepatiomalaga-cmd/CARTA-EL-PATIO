/* EL PATIO MÁLAGA — MOTOR DE LA CARTA
   NO EDITES LOS PRODUCTOS AQUÍ.
   Los productos están en datos/menu.js
*/
const DATA = window.MENU_DATA;

/* EL PATIO MÁLAGA — menu.js
   Versión autónoma: no necesita servidor local ni fetch de menu.json.
   Puedes abrir index.html directamente o usar Brackets Live Preview.
*/
const nav = document.getElementById("nav");
const menuRoot = document.getElementById("menu");
const search = document.getElementById("search");
const empty = document.getElementById("empty");
const topButton = document.getElementById("top");
const restaurantName = document.getElementById("restaurantName");
const instagram = document.getElementById("instagram");
const hours = document.getElementById("hours");
const welcome = document.getElementById("welcome");
const story = document.getElementById("story");

// VENTANA DE DETALLE DEL PRODUCTO
const productoModal = document.getElementById("productoModal");
const productoModalImagen = document.getElementById("productoModalImagen");
const productoModalNombre = document.getElementById("productoModalNombre");
const productoModalDescripcion = document.getElementById("productoModalDescripcion");
const productoModalPrecio = document.getElementById("productoModalPrecio");

function abrirDetalleProducto(item){
  if(!productoModal) return;

  productoModalImagen.src = item.imagen || "";
  productoModalImagen.alt = item.nombre || "Producto";
  productoModalNombre.textContent = item.nombre || "";
  productoModalDescripcion.textContent = item.descripcion || "Sin descripción disponible.";
  productoModalPrecio.textContent = money(item.precio);

  productoModal.classList.add("abierto");
  productoModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-abierto");

  // Lleva el foco al botón de cierre para facilitar el uso con teclado.
  productoModal.querySelector(".producto-modal-cerrar")?.focus();
}

function cerrarDetalleProducto(){
  if(!productoModal) return;

  productoModal.classList.remove("abierto");
  productoModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-abierto");
}

if(productoModal){
  productoModal.querySelectorAll("[data-modal-close]").forEach(el => {
    el.addEventListener("click", cerrarDetalleProducto);
  });

  document.addEventListener("keydown", e => {
    if(e.key === "Escape" && productoModal.classList.contains("abierto")){
      cerrarDetalleProducto();
    }
  });
}

const money = n => n == null ? "Consultar" : new Intl.NumberFormat("es-CO", {style:"currency", currency:"COP", maximumFractionDigits:0}).format(n);
const slug = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function imageHTML(item){
  return `<div class="photo"><img loading="lazy" src="${item.imagen}" alt="${item.nombre}" data-fallback="${item.imagen}"></div>`;
}

function activateImageFallbacks(){
  document.querySelectorAll('.photo img[data-fallback]').forEach(img => {
    const showPlaceholder = () => {
      const box = img.parentElement;
      if (!box || box.dataset.fallbackShown === '1') return;
      box.dataset.fallbackShown = '1';
      const alt = img.alt;
      const path = img.dataset.fallback;
      img.remove();
      const placeholder = document.createElement('div');
      placeholder.className = 'placeholder';
      placeholder.innerHTML = `<strong>Foto de ${alt}</strong><small>Coloca la imagen en:<br>${path}</small>`;
      box.appendChild(placeholder);
    };
    img.addEventListener('error', showPlaceholder, {once:true});
    if (img.complete && img.naturalWidth === 0) showPlaceholder();
  });
}

function renderNav(){
  const links = [`<a href="#inicio" class="active" data-category="inicio">TODOS</a>`];
  links.push(...Object.keys(DATA.categorias).map(c => `<a href="#${slug(c)}" data-category="${slug(c)}">${c.toUpperCase()}</a>`));
  nav.innerHTML = links.join("");
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setTimeout(() => setActiveNav(a.dataset.category), 50));
  });
}

function setActiveNav(category){
  nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.category === category));
  // Solo desplazamos la BARRA de categorías en horizontal.
  // No usamos scrollIntoView() porque puede provocar saltos verticales
  // de la página mientras el usuario hace scroll.
  const active = nav.querySelector(`a[data-category="${category}"]`);
  if(active){
    const target = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    nav.scrollTo({left: Math.max(0, target), behavior:'smooth'});
  }
}

function render(query=""){
  const q = query.trim().toLowerCase();
  menuRoot.innerHTML = "";
  let total = 0, sectionIndex = 0;
  const sections = Object.entries(DATA.categorias);

  sections.forEach(([category, items]) => {
    const filtered = items.filter(x => (x.nombre + " " + x.descripcion).toLowerCase().includes(q));
    if (!filtered.length) return;
    total += filtered.length;
    const section = document.createElement("section");
    section.className = "section";
    section.id = slug(category);
    section.innerHTML = `
      <div class="section-heading">
        <div class="section-heading-left">
          <h2 class="section-title">${category}</h2>
          <div class="section-count">${filtered.length} ${filtered.length === 1 ? 'PRODUCTO' : 'PRODUCTOS'}</div>
        </div>
        <button class="section-next" type="button" aria-label="Siguiente categoría">›</button>
      </div>
      <div class="rule"></div>
      <div class="grid">${filtered.map(item => `
        <article class="card producto-card" tabindex="0" role="button" aria-label="Ver detalles de ${item.nombre.replace(/"/g, '&quot;')}">
          ${imageHTML(item)}
          <div class="body">
            <h3 class="name">${item.nombre}</h3>
            ${item.descripcion ? `<p class="desc">${item.descripcion}</p>` : ""}
            <div class="bottom"><span class="price">${money(item.precio)}</span></div>
          </div>
        </article>`).join("")}</div>`;
    menuRoot.appendChild(section);

    // Al tocar/clickar una tarjeta se abre la descripción completa.
    section.querySelectorAll(".producto-card").forEach((card, index) => {
      const item = filtered[index];

      const abrir = () => abrirDetalleProducto(item);

      card.addEventListener("click", abrir);
      card.addEventListener("keydown", e => {
        if(e.key === "Enter" || e.key === " "){
          e.preventDefault();
          abrir();
        }
      });
    });

    const next = section.querySelector('.section-next');
    next.addEventListener('click', () => {
      // Busca la siguiente sección aunque haya una foto separadora entre ambas.
      let nextSection = section.nextElementSibling;
      while(nextSection && !nextSection.classList.contains('section')){
        nextSection = nextSection.nextElementSibling;
      }
      if(nextSection) nextSection.scrollIntoView({behavior:'smooth',block:'start'});
      else document.querySelector('.footer')?.scrollIntoView({behavior:'smooth',block:'start'});
    });

    activateImageFallbacks();
    sectionIndex++;
    if (!q && sectionIndex === 4) {
      const ambience = document.createElement("div");
      ambience.className = "ambience";
      ambience.innerHTML = `<img loading="lazy" src="${DATA.imagenes_ambiente.separadores[0]}" alt="Ambiente de El Patio Málaga" onerror="this.style.display='none'">`;
      menuRoot.appendChild(ambience);
    }
  });
  empty.style.display = total ? "none" : "block";
}

restaurantName.textContent = DATA.restaurante.nombre;
instagram.textContent = DATA.restaurante.instagram;
hours.textContent = DATA.restaurante.horario;
welcome.textContent = DATA.restaurante.bienvenida;
story.textContent = DATA.restaurante.texto;
renderNav();
render();
search.addEventListener("input", e => render(e.target.value));

// Marca automáticamente la categoría visible mientras el usuario baja.
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
  if(visible) setActiveNav(visible.target.id);
}, {rootMargin:'-18% 0px -68% 0px', threshold:[0,.15,.35,.6]});

document.querySelectorAll('.section').forEach(section => observer.observe(section));

window.addEventListener("scroll", () => { topButton.style.display = scrollY > 500 ? "block" : "none"; });
topButton.addEventListener("click", () => scrollTo({top:0, behavior:"smooth"}));