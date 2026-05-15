const API_URL = 'https://skyflix-backend-v26u.onrender.com';


let usuarioActual = null;
let tokenJWT = null;
let currentMovieId = null;
let currentMovieTitle = null;


function cargarUsuario() {
    const datosGuardados = localStorage.getItem('skyflix_usuario');
    const tokenGuardado = localStorage.getItem('skyflix_token');
    
    if (datosGuardados && tokenGuardado) {
        try {
            usuarioActual = JSON.parse(datosGuardados);
            tokenJWT = tokenGuardado;
        } catch (e) {
            localStorage.removeItem('skyflix_usuario');
            localStorage.removeItem('skyflix_token');
        }
    }
    actualizarUIUsuario();
}


function actualizarUIUsuario() {
    const authItems = document.getElementById('auth-nav-item');
    const userItems = document.getElementById('user-nav-item');
    
    if (usuarioActual && tokenJWT) {
        if (authItems) authItems.classList.add('d-none');
        if (userItems) {
            userItems.classList.remove('d-none');
            document.getElementById('user-name').textContent = `Hola, ${usuarioActual.nombre}`;
        }
        
        
        const formComentario = document.getElementById('form-comentario');
        const noAutMsg = document.getElementById('no-autenticado-msg');
        if (formComentario) formComentario.style.display = 'block';
        if (noAutMsg) noAutMsg.style.display = 'none';
    } else {
        if (authItems) authItems.classList.remove('d-none');
        if (userItems) userItems.classList.add('d-none');
        
        
        const formComentario = document.getElementById('form-comentario');
        const noAutMsg = document.getElementById('no-autenticado-msg');
        if (formComentario) formComentario.style.display = 'none';
        if (noAutMsg) noAutMsg.style.display = 'block';
    }
}


async function registrarUsuario(nombre, email, contrasena) {
    const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, contraseña: contrasena })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
    }
    
    
    usuarioActual = data.usuario;
    tokenJWT = data.token;
    localStorage.setItem('skyflix_usuario', JSON.stringify(data.usuario));
    localStorage.setItem('skyflix_token', data.token);
    
    actualizarUIUsuario();
    return data;
}


async function loginUsuario(email, contrasena) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, contraseña: contrasena })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
    }
    
    
    usuarioActual = data.usuario;
    tokenJWT = data.token;
    localStorage.setItem('skyflix_usuario', JSON.stringify(data.usuario));
    localStorage.setItem('skyflix_token', data.token);
    
    actualizarUIUsuario();
    return data;
}


function logout() {
    usuarioActual = null;
    tokenJWT = null;
    localStorage.removeItem('skyflix_usuario');
    localStorage.removeItem('skyflix_token');
    actualizarUIUsuario();
}


async function obtenerComentarios(imdbId) {
    try {
        const response = await fetch(`${API_URL}/api/comentarios/${imdbId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        return data.comentarios || [];
    } catch (error) {
        console.error('Error obteniendo comentarios:', error);
        return [];
    }
}


async function crearComentario(imdbId, titulo, comentario, puntuacion) {
    if (!tokenJWT) throw new Error('No estás autenticado');
    
    const response = await fetch(`${API_URL}/api/comentarios`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenJWT}`
        },
        body: JSON.stringify({ imdbId, titulo, comentario, puntuacion })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    return data.comentario;
}


async function editarComentario(id, comentario, puntuacion) {
    if (!tokenJWT) throw new Error('No estás autenticado');
    
    const response = await fetch(`${API_URL}/api/comentarios/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenJWT}`
        },
        body: JSON.stringify({ comentario, puntuacion })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    return data.comentario;
}


async function eliminarComentario(id) {
    if (!tokenJWT) throw new Error('No estás autenticado');
    
    const response = await fetch(`${API_URL}/api/comentarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tokenJWT}` }
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
    }
    
    return true;
}


function formatearFecha(fecha) {
    if (!fecha) return '';
    const d = new Date(fecha);
    const ahora = new Date();
    const diff = ahora - d;
    const mins = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (mins < 1) return 'Justo ahora';
    if (mins < 60) return `Hace ${mins} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias}d`;
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}


async function renderizarComentarios(imdbId) {
    const listDiv = document.getElementById('comentarios-list');
    const resumenDiv = document.getElementById('comentarios-resumen');
    if (!listDiv) return;

    listDiv.innerHTML = '';
    if (resumenDiv) {
        resumenDiv.innerHTML = '';
    }

    try {
        const comentarios = await obtenerComentarios(imdbId);
        
        if (comentarios.length === 0) {
            if (resumenDiv) {
                resumenDiv.innerHTML = '<span class="resumen-pill">Sin comentarios todavía</span>';
            }
            listDiv.innerHTML = '';
            return;
        }

        
        const promedio = (comentarios.reduce((sum, c) => sum + c.puntuacion, 0) / comentarios.length).toFixed(1);
        if (resumenDiv) {
            resumenDiv.innerHTML = `
                <span class="resumen-pill resumen-pill-accent">Promedio ${promedio}/10</span>
                <span class="resumen-pill resumen-pill-comments">${comentarios.length} comentario${comentarios.length !== 1 ? 's' : ''}</span>`;
        }

        listDiv.innerHTML = `
            ${comentarios.map(com => {
                const nombreUsuario = com.usuario?.nombre || 'Usuario';
                const puedeEditar = usuarioActual && (usuarioActual.id === com.usuario?._id || usuarioActual.id === com.usuario?.id);
                const fecha = formatearFecha(com.createdAt);
                const editado = com.updatedAt && com.createdAt !== com.updatedAt ? ' (editado)' : '';
                return `
                <div class="comentario-item mb-2" data-comment-id="${com._id}">
                    <div class="d-flex align-items-start gap-2">
                        <div class="comentario-avatar"></div>
                        <div class="flex-grow-1 min-width-0">
                            <div class="d-flex justify-content-between align-items-center flex-wrap gap-1">
                                <div class="d-flex align-items-center gap-2 flex-wrap">
                                    <strong class="comentario-nombre">${nombreUsuario}</strong>
                                    <span class="comentario-fecha">${fecha}${editado}</span>
                                </div>
                                <div class="d-flex align-items-center gap-2">
                                    <span class="comentario-rating">${com.puntuacion}/10</span>
                                    ${puedeEditar ? `
                                        <div class="dropdown">
                                            <button class="btn btn-link btn-sm text-light p-0 dropdown-toggle-no-caret" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="line-height:1">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                                                </svg>
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end">
                                                <li><a class="dropdown-item btn-edit-comentario" href="#" data-id="${com._id}" data-texto="${com.comentario.replace(/"/g, '&quot;')}" data-puntuacion="${com.puntuacion}">✎ Editar</a></li>
                                                <li><a class="dropdown-item link-accent btn-delete-comentario" href="#" data-id="${com._id}">✖ Eliminar</a></li>
                                            </ul>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <p class="comentario-texto mb-0">${com.comentario}</p>
                        </div>
                    </div>
                </div>`;
            }).join('')}`;


        listDiv.querySelectorAll('.btn-delete-comentario').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = e.currentTarget.dataset.id;
                if (confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
                    try {
                        await eliminarComentario(id);
                        renderizarComentarios(currentMovieId);
                    } catch (error) {
                        console.error('Error: ' + error.message);
                    }
                }
            });
        });


        listDiv.querySelectorAll('.btn-edit-comentario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = e.currentTarget.dataset.id;
                const textoActual = e.currentTarget.dataset.texto;
                const puntuacionActual = e.currentTarget.dataset.puntuacion;
                abrirEdicionInline(id, textoActual, puntuacionActual);
            });
        });

    } catch (error) {
        console.error('Error renderizando comentarios:', error);
        if (resumenDiv) {
            resumenDiv.innerHTML = '<span class="resumen-pill">No se pudo cargar</span>';
        }
        listDiv.innerHTML = '<p class="text-light small">Error cargando comentarios</p>';
    }
}


function abrirEdicionInline(commentId, textoActual, puntuacionActual) {
    const commentEl = document.querySelector(`.comentario-item[data-comment-id="${commentId}"]`);
    if (!commentEl) return;

    const textoEl = commentEl.querySelector('.comentario-texto');
    if (!textoEl) return;


    const originalHTML = textoEl.innerHTML;
    textoEl.innerHTML = `
        <div class="edit-inline-form comentario-form-card mt-1">
            <textarea class="form-control form-control-sm comentario-textarea mb-2" rows="3" id="edit-text-${commentId}">${textoActual}</textarea>
            <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                <div class="d-flex align-items-center gap-2">
                    <label class="form-label mb-0 text-light small">Tu puntuación:</label>
                    <input type="range" class="form-range puntuacion-range" min="1" max="10" value="${puntuacionActual}" id="edit-punt-${commentId}">
                    <span class="badge bg-warning text-dark" id="edit-punt-val-${commentId}">${puntuacionActual}/10</span>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-warning btn-sm btn-guardar-edit" data-id="${commentId}">Guardar</button>
                    <button class="btn btn-outline-light btn-sm btn-cancelar-edit">Cancelar</button>
                </div>
            </div>
        </div>`;


    const slider = document.getElementById(`edit-punt-${commentId}`);
    const valSpan = document.getElementById(`edit-punt-val-${commentId}`);
    if (slider && valSpan) {
        slider.addEventListener('input', () => {
            valSpan.textContent = `${slider.value}/10`;
        });
    }


    textoEl.querySelector('.btn-guardar-edit').addEventListener('click', async () => {
        const nuevoTexto = document.getElementById(`edit-text-${commentId}`).value.trim();
        const nuevaPuntuacion = parseInt(document.getElementById(`edit-punt-${commentId}`).value);

        if (!nuevoTexto) {
            return;
        }

        try {
            await editarComentario(commentId, nuevoTexto, nuevaPuntuacion);
            renderizarComentarios(currentMovieId);
        } catch (error) {
            console.error('Error: ' + error.message);
        }
    });


    textoEl.querySelector('.btn-cancelar-edit').addEventListener('click', () => {
        textoEl.innerHTML = originalHTML;
    });
}


let featuredItems = [];
const RESULTS_PER_PAGE = 30;

let activeSearch = null;

async function enrichItemsForListing(items, { concurrency = 6 } = {}) {
    const queue = items.filter(it => it && (it.apiId || it.id) && !it._enriched);
    let idx = 0;

    async function worker() {
        while (idx < queue.length) {
            const current = queue[idx++];
            const id = current.apiId || current.id;
            if (!id || !/^tt\d+$/.test(String(id))) {
                current._enriched = true;
                continue;
            }
            try {
                const more = await getOmdbDetails(id);
                if (more?.Title) current.title = more.Title;
                if (more?.Year) current.year = more.Year;
                if (more?.Type) current.type = more.Type === 'movie' ? 'Pelicula' : (more.Type === 'series' ? 'Serie' : current.type);
                if (more?.Poster && more.Poster !== 'N/A') current.poster = more.Poster;
                if (more?.Genre && more.Genre !== 'N/A') current.genres = more.Genre;
                if (more?.Plot && more.Plot !== 'N/A') current.summary = more.Plot;
                if (more?.imdbRating) {
                    const num = parseFloat(more.imdbRating);
                    if (!Number.isNaN(num)) current.rating = num;
                }
                itemCache[id] = current;
            } catch (e) {
            } finally {
                current._enriched = true;
            }
        }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
}

const OMDB_BASE_URL = 'https://www.omdbapi.com/';
const OMDB_API_KEY = 'thewdb';

async function omdbFetch(params = {}) {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.append('apikey', OMDB_API_KEY);
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`OMDb error ${resp.status}`);
    return resp.json();
}

async function searchOmdb(query, page = 1) {
    return omdbFetch({ s: query, page: String(page) });
}

async function getOmdbDetails(id) {
    return omdbFetch({ i: id, plot: 'short' });
}

function normalizeText(s) {
    return String(s || '').trim().toLowerCase();
}

function buildItemFromOmdbDetails(detail, fallbackId) {
    const id = detail?.imdbID || fallbackId;
    return {
        id,
        apiId: id,
        title: detail?.Title || 'Unknown title',
        year: detail?.Year || 'N/A',
        rating: parseFloat(detail?.imdbRating) || 0,
        type: detail?.Type === 'movie' ? 'Pelicula' : (detail?.Type === 'series' ? 'Serie' : 'N/A'),
        genres: detail?.Genre && detail.Genre !== 'N/A' ? detail.Genre : '',
        summary: detail?.Plot && detail.Plot !== 'N/A' ? detail.Plot : '',
        poster: detail?.Poster && detail.Poster !== 'N/A' ? detail.Poster : ''
    };
}

async function enrichItemFromOmdb(item) {
    try {
        let matchId = typeof item === 'string' ? item : null;
        
        if (!matchId && typeof item === 'object') {
            if (item.id && item.id.match(/^tt\d+$/)) {
                matchId = item.id;
            } else if (item.apiId && item.apiId.match(/^tt\d+$/)) {
                matchId = item.apiId;
            }
        }
        
        if (matchId) {
            const detail = await getOmdbDetails(matchId);
            
            if (detail && detail.Title) {
                if (typeof item === 'string') {
                    item = { id: matchId };
                }
                item.title = detail.Title;
                item.year = detail.Year;
                item.rating = parseFloat(detail.imdbRating) || 0;
                item.summary = detail.Plot !== 'N/A' ? detail.Plot : '';
                if (detail.Poster && detail.Poster !== 'N/A') {
                    item.poster = detail.Poster;
                }
                if (detail.Genre) {
                    item.genres = detail.Genre;
                }
                item.apiId = matchId;
                item.type = detail.Type === 'movie' ? 'Pelicula' : (detail.Type === 'series' ? 'Serie' : '');
                item.id = matchId;
                
                itemCache[matchId] = item;
            }
        }
    } catch (e) {
    }
    return item;
}

const featuredIds = [
    'tt0468569',
    'tt0903747',
    'tt0144084',
    'tt0068646',
    'tt0111161',
    'tt0816692',
    'tt0110912',
    'tt0137523',
    'tt0109830',
    'tt0133093',
    'tt15398776',
    'tt7366338'
];

const specialIds = [
    'tt0238784',
    'tt2580046',
    'tt0108778',
    'tt26471411',
    'tt9145880',
    'tt0397442',
    'tt0096697',
    'tt7678620',
    'tt11126994',
    'tt22248376',
    'tt5311514',
    'tt4574736'
];

const itemCache = {};

function findItemById(id) {
    if (itemCache[id]) return itemCache[id];
    
    const inFeatured = featuredItems.find(item => item.id === id);
    if (inFeatured) return inFeatured;

    return activeSearch?.items?.find(item => item.id === id) || null;
}

async function loadFeaturedSelection() {
    featuredItems = featuredIds.map(id => ({ id }));
    await Promise.all(featuredItems.map(enrichItemFromOmdb));
}

function renderItemsGrid(container, items) {
    if (!container) return;

    container.innerHTML = '';
    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 col-xl-2 mb-4';
        const ratingText = item.rating > 0 ? `${item.rating.toFixed(1)}/10` : 'Sin rating disponible';
        const rating = `<p class="card-text mb-2"><strong>Rating:</strong> ${ratingText}</p>`;
        const poster = item.poster || 'https://via.placeholder.com/200x300?text=Sin+Imagen';
        const itemId = item.apiId || item.id;

        col.innerHTML = `
            <div class="card h-100">
                <img src="${poster}"
                     class="card-img-top"
                     alt="${item.poster ? item.title : 'Sin Imagen'}"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/200x300?text=Sin+Imagen';this.alt='Sin Imagen';">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text mb-1">(${item.year})</p>
                    ${rating}
                    <button class="btn btn-outline-light mt-auto ver-detalles-btn" data-item-id="${itemId}" data-bs-toggle="modal" data-bs-target="#detailsModal">
                        Ver detalles
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    container.querySelectorAll('.ver-detalles-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const itemId = e.currentTarget.getAttribute('data-item-id');
            await openDetailsModal(itemId);
        });
    });
}

function renderCatalogue() {
    const container = document.getElementById('catalogue');
    renderItemsGrid(container, featuredItems);
}

function renderSpecialSelection(items) {
    const container = document.getElementById('especial-grid');
    if (!container) return;
    
    renderItemsGrid(container, items);
}

function resolveDirectIdFromQuery(query) {
    const q = normalizeText(query);
    return /^tt\d+$/.test(q) ? q : '';
}

function makeTitleYearKey(title, year, rawType) {
    const baseTitle = String(title || '')
        .replace(/\s*\(\d{4}\)\s*$/, '')
        .trim()
        .toLowerCase();
    return `${baseTitle}|${String(year || '').trim()}|${String(rawType || '').trim().toLowerCase()}`;
}

function renderPaginationControls() {
    const ul = document.getElementById('resultados-pagination');
    if (!ul) return;

    if (!activeSearch || activeSearch.mode !== 'text') {
        ul.innerHTML = '';
        return;
    }

    const totalPages = activeSearch.totalResults ? Math.max(1, Math.ceil(activeSearch.totalResults / RESULTS_PER_PAGE)) : 1;
    const current = activeSearch.page || 1;

    function addItem(label, page, { disabled = false, active = false } = {}) {
        const li = document.createElement('li');
        li.className = `page-item${disabled ? ' disabled' : ''}${active ? ' active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = label;
        a.addEventListener('click', async (e) => {
            e.preventDefault();
            if (disabled || active) return;
            await goToResultsPage(page);
        });
        li.appendChild(a);
        ul.appendChild(li);
    }

    ul.innerHTML = '';
    addItem('Anterior', Math.max(1, current - 1), { disabled: current <= 1 });

    const windowSize = 2;
    const start = Math.max(1, current - windowSize);
    const end = Math.min(totalPages, current + windowSize);

    if (start > 1) {
        addItem('1', 1, { active: current === 1 });
        if (start > 2) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = `<span class="page-link">…</span>`;
            ul.appendChild(li);
        }
    }

    for (let p = start; p <= end; p++) {
        addItem(String(p), p, { active: p === current });
    }

    if (end < totalPages) {
        if (end < totalPages - 1) {
            const li = document.createElement('li');
            li.className = 'page-item disabled';
            li.innerHTML = `<span class="page-link">…</span>`;
            ul.appendChild(li);
        }
        addItem(String(totalPages), totalPages, { active: current === totalPages });
    }

    addItem('Siguiente', Math.min(totalPages, current + 1), { disabled: current >= totalPages });
}

async function ensureSearchItemsForPage(page) {
    if (!activeSearch || activeSearch.mode !== 'text') return;

    const needed = page * RESULTS_PER_PAGE;
    while (!activeSearch.done && activeSearch.items.length < needed) {
        const remaining = needed - activeSearch.items.length;
        const pagesToFetch = Math.min(3, Math.max(1, Math.ceil(remaining / 10)));
        const pages = [];
        for (let i = 1; i <= pagesToFetch; i++) {
            pages.push(activeSearch.omdbPage + i);
        }
        activeSearch.omdbPage += pagesToFetch;
        const responses = await Promise.all(pages.map(p => searchOmdb(activeSearch.query, p)));
        for (const resp of responses) {
            if (resp?.Response === 'False') {
                activeSearch.done = true;
                break;
            }

            if (!activeSearch.totalResults && resp?.totalResults) {
                const num = parseInt(resp.totalResults, 10);
                if (!Number.isNaN(num)) activeSearch.totalResults = num;
            }

            const pageItems = resp?.Search || [];
            if (!pageItems.length) {
                activeSearch.done = true;
                break;
            }

            for (const r of pageItems) {
                if (!r?.imdbID || activeSearch.seen.has(r.imdbID)) continue;
                const titleKey = makeTitleYearKey(r.Title, r.Year, r.Type);
                if (activeSearch.seenKeys.has(titleKey)) continue;
                activeSearch.seen.add(r.imdbID);
                activeSearch.seenKeys.add(titleKey);
                activeSearch.items.push({
                    id: r.imdbID,
                    apiId: r.imdbID,
                    title: r.Title,
                    year: r.Year,
                    rating: 0,
                    type: r.Type === 'movie' ? 'Pelicula' : 'Serie',
                    rawType: r.Type,
                    genres: '',
                    summary: '',
                    poster: (r.Poster && r.Poster !== 'N/A') ? r.Poster : ''
                });
            }
        }

        if (activeSearch.totalResults && activeSearch.seen.size >= activeSearch.totalResults) {
            activeSearch.done = true;
            break;
        }
    }
}

async function goToResultsPage(page) {
    if (!activeSearch) return;

    if (activeSearch.mode === 'direct') {
        activeSearch.page = 1;
        renderPaginationControls();
        return;
    }

    await ensureSearchItemsForPage(page);
    activeSearch.page = page;

    const grid = document.getElementById('resultados-grid');
    const start = (page - 1) * RESULTS_PER_PAGE;
    const pageItems = activeSearch.items.slice(start, start + RESULTS_PER_PAGE);
    renderItemsGrid(grid, pageItems);
    renderPaginationControls();

    const token = activeSearch.token;
    enrichItemsForListing(pageItems).then(() => {
        if (!activeSearch || activeSearch.token !== token || activeSearch.page !== page) return;
        const gridNow = document.getElementById('resultados-grid');
        const startNow = (page - 1) * RESULTS_PER_PAGE;
        const pageItemsNow = activeSearch.items.slice(startNow, startNow + RESULTS_PER_PAGE);
        renderItemsGrid(gridNow, pageItemsNow);
    });

    const sectionEl = document.getElementById('resultados');
    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
}

async function openDetailsModal(itemId) {
    const modalBody = document.getElementById('details-modal-body');
    let details = findItemById(itemId);

    if (!details) {
        modalBody.innerHTML = '<p>No se pudieron cargar los detalles.</p>';
        return;
    }

    const detailsId = details.apiId || details.id;
    if (detailsId && (!details.summary || !details.genres || !details.rating)) {
        try {
            const more = await getOmdbDetails(detailsId);
            if (more?.Title) details.title = more.Title;
            if (more?.Year) details.year = more.Year;
            if (more?.Type) details.type = more.Type === 'movie' ? 'Pelicula' : (more.Type === 'series' ? 'Serie' : details.type);
            if (more?.Poster && more.Poster !== 'N/A') details.poster = more.Poster;
            if (more?.Plot && more.Plot !== 'N/A') details.summary = more.Plot;
            if (more?.Genre && more.Genre !== 'N/A') details.genres = more.Genre;
            if (more?.imdbRating) {
                const num = parseFloat(more.imdbRating);
                if (!isNaN(num)) details.rating = num;
            }
        } catch (e) {
            console.warn('No se pudieron cargar detalles adicionales:', e.message);
        }
    }

    const year = details.year || 'N/A';
    const poster = details.poster || 'https://via.placeholder.com/400x600?text=Sin+Imagen';
    const genres = details.genres || 'Sin información';
    const ratingValue = details.rating || 0;
    const ratingText = ratingValue > 0 ? `${ratingValue.toFixed(1)}/10` : 'Sin rating';
    const summary = details.summary || 'Sin sinopsis disponible en este momento.';
    const typeLabel = details.type || 'N/A';
    const imdbId = details.apiId || details.id;
    const imdbUrl = (typeof imdbId === 'string' && /^tt\d+$/.test(imdbId)) ? `https://www.imdb.com/title/${imdbId}/` : null;
    const esPTW = getListFromStorage('skyflix_ptw').some(v => v.id === imdbId);

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-4 mb-3 mb-md-0">
                <img src="${poster}"
                     class="img-fluid rounded"
                     alt="${details.poster ? details.title : 'Sin Imagen'}"
                     onerror="this.onerror=null;this.src='https://via.placeholder.com/400x600?text=Sin+Imagen';this.alt='Sin Imagen';">
            </div>
            <div class="col-md-8">
                <h2 class="h4 mb-3">${details.title}</h2>
                <p><strong>Año:</strong> ${year}</p>
                <p><strong>Género:</strong> ${genres}</p>
                <p><strong>Tipo:</strong> ${typeLabel}</p>
                <p><strong>Rating:</strong> ${ratingText}</p>
                <p>${summary}</p>
                <div class="mt-3 d-flex gap-2 flex-wrap">
                    ${imdbUrl ? `<a class="btn btn-outline-light" href="${imdbUrl}" target="_blank" rel="noopener noreferrer">Ver en IMDb</a>` : ''}
                    <button id="btn-ptw" class="btn ${esPTW ? 'btn-ptw-activo' : 'btn-outline-ptw'}" data-item-id="${imdbId}">
                        ${esPTW ? 'Eliminar de Favoritos' : 'Añadir a Favoritos'}
                    </button>
                </div>
            </div>
        </div>
        <div id="comentarios-section" class="comentarios-panel mt-3">
            <div class="comentarios-top mb-3">
                <div class="d-flex align-items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#f4c430" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-2.5a2 2 0 0 0-1.6.8L8 14.333 6.1 11.8a2 2 0 0 0-1.6-.8H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                    </svg>
                    <h6 class="mb-0 fw-semibold">Comentarios</h6>
                </div>
            </div>
            <div id="comentarios-resumen" class="comentarios-resumen mb-3">
                <span class="resumen-pill">Sin comentarios todavía</span>
            </div>
            <div id="comentarios-list" class="mb-3"></div>

            
            <div id="form-comentario" class="comentario-form-card" style="display: none;">
                <textarea id="comentario-text" class="form-control form-control-sm comentario-textarea mb-2" placeholder="Escribe tu opinión sobre esta película..." rows="3"></textarea>
                <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <label for="puntuacion-slider" class="form-label mb-0 text-light small">Tu puntuación:</label>
                        <input type="range" class="form-range puntuacion-range" id="puntuacion-slider" min="1" max="10" value="10">
                        <span class="badge bg-warning text-dark" id="puntuacion-valor">10/10</span>
                    </div>
                    <button id="btn-enviar-comentario" class="btn btn-warning btn-sm">Enviar comentario</button>
                </div>
            </div>
            <div id="no-autenticado-msg" class="no-auth-prompt text-center" style="display: none;">
                <p class="text-light small mb-3">Inicia sesión para dejar tu opinión y calificar</p>
                <div class="d-flex justify-content-center flex-wrap gap-2">
                    <button id="login-from-comments" class="btn btn-sm btn-skyflix">Iniciar Sesión</button>
                    <button id="register-from-comments" class="btn btn-sm btn-skyflix">Registrarse</button>
                </div>
            </div>
        </div>
    `;


    currentMovieId = imdbId;
    currentMovieTitle = details.title;


    const modalLabel = document.getElementById('detailsModalLabel');
    if (modalLabel) modalLabel.textContent = details.title;


    actualizarUIUsuario();
    renderizarComentarios(currentMovieId);


    bindComentarioEvents();
}
function bindComentarioEvents() {
    const slider = document.getElementById('puntuacion-slider');
    const valor = document.getElementById('puntuacion-valor');
    if (slider && valor) {
        slider.addEventListener('input', () => { valor.textContent = `${slider.value}/10`; });
    }

    const btnEnviar = document.getElementById('btn-enviar-comentario');
    if (btnEnviar) {
        btnEnviar.addEventListener('click', async () => {
            if (!usuarioActual || !tokenJWT) { return; }
            if (!currentMovieId) { return; }
            const comentarioText = document.getElementById('comentario-text');
            const puntuacionSlider = document.getElementById('puntuacion-slider');
            if (!comentarioText || !puntuacionSlider) return;
            const comentario = comentarioText.value.trim();
            const puntuacion = parseInt(puntuacionSlider.value);
            if (!comentario) { return; }
            try {
                btnEnviar.disabled = true;
                btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Enviando...';
                await crearComentario(currentMovieId, currentMovieTitle || 'Película', comentario, puntuacion);
                comentarioText.value = '';
                puntuacionSlider.value = '10';
                document.getElementById('puntuacion-valor').textContent = '10/10';
                renderizarComentarios(currentMovieId);
            } catch (error) {
                console.error('Error: ' + error.message);
            } finally {
                btnEnviar.disabled = false;
                btnEnviar.textContent = 'Enviar comentario';
            }
        });
    }

    const btnPTW = document.getElementById('btn-ptw');
    if (btnPTW) {
        btnPTW.addEventListener('click', () => {
            const id = btnPTW.dataset.itemId;
            const item = findItemById(id);
            const data = {
                id,
                title: item?.title || id,
                poster: item?.poster || '',
                year: item?.year || '',
                rating: item?.rating || 0
            };
            const ptw = getListFromStorage('skyflix_ptw');
            const esPTW = ptw.some(v => v.id === id);
            if (esPTW) {
                saveListToStorage('skyflix_ptw', ptw.filter(v => v.id !== id));
            } else {
                saveListToStorage('skyflix_ptw', [...ptw, data]);
            }
            actualizarEstadoBotonesDetalle();
        });
    }

    const loginFromComments = document.getElementById('login-from-comments');
    if (loginFromComments) {
        loginFromComments.addEventListener('click', (e) => {
            e.preventDefault();
            const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
            if (detailsModal) {
                detailsModal.hide();
                document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function handler() {
                    document.getElementById('detailsModal').removeEventListener('hidden.bs.modal', handler);
                    const targetModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    targetModal.show();
                });
            } else {
                const targetModal = new bootstrap.Modal(document.getElementById('loginModal'));
                targetModal.show();
            }
        });
    }

    const registerFromComments = document.getElementById('register-from-comments');
    if (registerFromComments) {
        registerFromComments.addEventListener('click', (e) => {
            e.preventDefault();
            const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
            if (detailsModal) {
                detailsModal.hide();
                document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function handler() {
                    document.getElementById('detailsModal').removeEventListener('hidden.bs.modal', handler);
                    const targetModal = new bootstrap.Modal(document.getElementById('registerModal'));
                    targetModal.show();
                });
            } else {
                const targetModal = new bootstrap.Modal(document.getElementById('registerModal'));
                targetModal.show();
            }
        });
    }
}

function actualizarEstadoBotonesDetalle() {
    const btnPTW = document.getElementById('btn-ptw');
    const id = btnPTW?.dataset.itemId;
    if (!id) return;
    const ptw = getListFromStorage('skyflix_ptw');
    const esPTW = ptw.some(v => v.id === id);
    if (btnPTW) {
        btnPTW.className = `btn ${esPTW ? 'btn-ptw-activo' : 'btn-outline-ptw'}`;
        btnPTW.textContent = esPTW ? 'Eliminar de Favoritos' : 'Añadir a Favoritos';
    }
}

function getListFromStorage(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

function saveListToStorage(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
}

async function cargarPerfil() {
    if (!usuarioActual) return;
    document.getElementById('perfil-avatar').textContent = '';
    const navAvatar = document.getElementById('user-avatar-nav');
    if (navAvatar) navAvatar.textContent = '';
    document.getElementById('perfil-nombre').textContent = usuarioActual.nombre;
    document.getElementById('perfil-email').textContent = usuarioActual.email || '';

    const ptw = getListFromStorage('skyflix_ptw');
    document.getElementById('stat-pendientes').textContent = `Total ${ptw.length}`;

    renderPerfilGrid('perfil-pendientes-grid', ptw, 'skyflix_ptw');
    await cargarComentariosPerfil();
}

function renderPerfilGrid(containerId, items, storageKey) {
    const grid = document.getElementById(containerId);
    if (!grid) return;
    if (!items.length) {
        grid.innerHTML = '<p class="text-light text-center py-4 w-100">No hay nada aquí todavía.</p>';
        return;
    }
    grid.innerHTML = items.map(item => `
        <div class="col-6 col-md-4 col-lg-3 col-xl-20 mb-4">
            <div class="card h-100">
                <img src="${item.poster || 'https://via.placeholder.com/200x300?text=Sin+Imagen'}" alt="${item.title}"
                     class="card-img-top"
                     onerror="this.src='https://via.placeholder.com/200x300?text=Sin+Imagen';this.alt='Sin Imagen';">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text mb-1">(${item.year || ''})</p>
                    <p class="card-text mb-3"><strong>Rating:</strong> ${item.rating && item.rating > 0 ? item.rating.toFixed(1) + '/10' : 'Sin rating'}</p>
                    <button class="btn btn-outline-light mt-auto btn-quitar-lista" data-id="${item.id}" data-key="${storageKey}">Eliminar de Favoritos</button>
                </div>
            </div>
        </div>`).join('');
    grid.querySelectorAll('.btn-quitar-lista').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const key = btn.dataset.key;
            const list = getListFromStorage(key).filter(v => v.id !== id);
            saveListToStorage(key, list);
            cargarPerfil();
        });
    });
}

async function cargarComentariosPerfil() {
    const container = document.getElementById('perfil-comentarios-list');
    if (!container || !tokenJWT) return;
    container.innerHTML = '<p class="text-light small text-center py-3">Cargando...</p>';
    try {
        const resp = await fetch(`${API_URL}/api/comentarios/usuario/mis`, {
            headers: { 'Authorization': `Bearer ${tokenJWT}` }
        });
        const data = await resp.json();
        const comentarios = data.comentarios || [];
        document.getElementById('stat-comentarios').textContent = `Total ${comentarios.length}`;
        if (!comentarios.length) {
            container.innerHTML = '<p class="text-light text-center py-4">No has comentado nada todavía.</p>';
            return;
        }
        container.innerHTML = comentarios.map(c => `
            <div class="comentario-item mb-2">
                <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                    <div>
                        <strong class="text-light small">${c.titulo || c.imdbId}</strong>
                        <p class="comentario-texto mb-1">${c.comentario}</p>
                        <span class="comentario-fecha">${formatearFecha(c.createdAt)}</span>
                    </div>
                    <span class="comentario-rating">${c.puntuacion}/10</span>
                </div>
            </div>`).join('');
    } catch {
        container.innerHTML = '<p class="text-light small text-center py-3">No se pudieron cargar los comentarios.</p>';
    }
}


window.addEventListener('DOMContentLoaded', async () => {

    cargarUsuario();

    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const destacadosSection = document.getElementById('destacados');
    const especialSection = document.getElementById('especial');
    const resultadosSection = document.getElementById('resultados');
    const resultsTitle = document.getElementById('resultados-titulo');
    const resultsGrid = document.getElementById('resultados-grid');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;

        if (resultsTitle) {
            resultsTitle.textContent = `Resultados de: ${query}`;
        }

        const directId = resolveDirectIdFromQuery(query);
        if (directId) {
            const detail = await getOmdbDetails(directId);
            const item = (detail && detail.Title) ? buildItemFromOmdbDetails(detail, directId) : null;
            activeSearch = { mode: 'direct', query, page: 1, items: item ? [item] : [] };
            if (item) itemCache[item.id] = item;
            renderItemsGrid(resultsGrid, activeSearch.items);
            renderPaginationControls();
        } else {
            activeSearch = {
                mode: 'text',
                query,
                page: 1,
                items: [],
                seen: new Set(),
                seenKeys: new Set(),
                omdbPage: 0,
                totalResults: 0,
                done: false,
                token: String(Date.now()) + Math.random().toString(16).slice(2)
            };
            await goToResultsPage(1);
        }

        if (destacadosSection) {
            destacadosSection.classList.add('d-none');
        }
        if (especialSection) {
            especialSection.classList.add('d-none');
        }
        if (resultadosSection) {
            resultadosSection.classList.remove('d-none');
            resultadosSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    try {
        await loadFeaturedSelection();
        renderCatalogue();

        const specialItems = specialIds.map(id => ({ id }));
        await Promise.all(specialItems.map(enrichItemFromOmdb));
        
        renderSpecialSelection(specialItems);
    } catch (e) {
        console.error('Error en init:', e);
    }



    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }


    document.getElementById('perfilModal')?.addEventListener('show.bs.modal', cargarPerfil);


    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const contrasena = document.getElementById('login-password').value;
            const errorDiv = document.getElementById('login-error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Ingresando...';
                errorDiv.style.display = 'none';

                await loginUsuario(email, contrasena);


                const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                if (modal) modal.hide();


                loginForm.reset();


                if (currentMovieId) {
                    const detailsModal = document.getElementById('detailsModal');
                    if (detailsModal && detailsModal.classList.contains('show')) {
                        actualizarUIUsuario();
                        renderizarComentarios(currentMovieId);
                    }
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Iniciar Sesión';
            }
        });
    }


    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('register-nombre').value;
            const email = document.getElementById('register-email').value;
            const contrasena = document.getElementById('register-password').value;
            const errorDiv = document.getElementById('register-error');
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            try {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Registrando...';
                errorDiv.style.display = 'none';

                await registrarUsuario(nombre, email, contrasena);


                const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
                if (modal) modal.hide();


                registerForm.reset();


                if (currentMovieId) {
                    const detailsModal = document.getElementById('detailsModal');
                    if (detailsModal && detailsModal.classList.contains('show')) {
                        actualizarUIUsuario();
                        renderizarComentarios(currentMovieId);
                    }
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Registrarse';
            }
        });
    }


    function openModalFromComments(targetModalId) {
        const detailsModal = bootstrap.Modal.getInstance(document.getElementById('detailsModal'));
        if (detailsModal) {
            detailsModal.hide();
            document.getElementById('detailsModal').addEventListener('hidden.bs.modal', function handler() {
                document.getElementById('detailsModal').removeEventListener('hidden.bs.modal', handler);
                const targetModal = new bootstrap.Modal(document.getElementById(targetModalId));
                targetModal.show();
            });
        } else {
            const targetModal = new bootstrap.Modal(document.getElementById(targetModalId));
            targetModal.show();
        }
    }

    const loginFromComments = document.getElementById('login-from-comments');
    if (loginFromComments) {
        loginFromComments.addEventListener('click', (e) => {
            e.preventDefault();
            openModalFromComments('loginModal');
        });
    }

    const registerFromComments = document.getElementById('register-from-comments');
    if (registerFromComments) {
        registerFromComments.addEventListener('click', (e) => {
            e.preventDefault();
            openModalFromComments('registerModal');
        });
    }


    document.getElementById('loginModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('login-error').style.display = 'none';
    });
    document.getElementById('registerModal')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('register-error').style.display = 'none';
    });


    function reopenDetailsIfNeeded() {
        if (usuarioActual && currentMovieId) {
            const detailsModalEl = document.getElementById('detailsModal');
            if (!detailsModalEl.classList.contains('show')) {
                const detailsModal = new bootstrap.Modal(detailsModalEl);
                detailsModal.show();

                setTimeout(() => {
                    actualizarUIUsuario();
                    renderizarComentarios(currentMovieId);
                }, 300);
            }
        }
    }

    document.getElementById('loginModal')?.addEventListener('hidden.bs.modal', reopenDetailsIfNeeded);
    document.getElementById('registerModal')?.addEventListener('hidden.bs.modal', reopenDetailsIfNeeded);
});