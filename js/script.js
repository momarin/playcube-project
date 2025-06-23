/* ----------------------------------------------------------------------- */
// CONFIGURAÇÕES DA API
const API_KEY = "7b58c21540537ddf08ae663041815eb7";
// const LANGUAGE = "pt-BR";
// const REGION = "BR";
const MOVIE_ID = 329865;
const API_URL = `https://api.themoviedb.org/3/movie/${MOVIE_ID}?api_key=${API_KEY}&language=pt-BR&append_to_response=credits,videos,images&include_image_language=pt,null`;

/* ----------------------------------------------------------------------- */
// === FUNÇÃO GLOBAL PARA FADE DOS CARROSSEIS ===
function updateFade($carousel, $wrapper) {
  const owl = $carousel.data("owl.carousel");
  if (!owl) return;

  const currentIndex = owl.relative(owl.current());
  const responsive = owl.settings.responsive || {};
  const breakpoints = Object.keys(responsive)
    .map(Number)
    .sort((a, b) => a - b);

  const windowWidth = $(window).width();
  let itemsVisible = owl.settings.items; // valor padrão

  for (let i = 0; i < breakpoints.length; i++) {
    if (windowWidth >= breakpoints[i]) {
      itemsVisible = responsive[breakpoints[i]].items;
    }
  }

  const totalItems = owl.items().length;

  if (currentIndex === 0) {
    $wrapper.addClass("no-fade-left");
  } else {
    $wrapper.removeClass("no-fade-left");
  }

  if (currentIndex + itemsVisible >= totalItems) {
    $wrapper.addClass("no-fade-right");
  } else {
    $wrapper.removeClass("no-fade-right");
  }
}

// ============= BUSCANDO FILME ===============
fetch(API_URL)
  .then((response) => response.json())
  .then((data) => {
    const director = data.credits.crew.find((p) => p.job === "Director");
    const writers = data.credits.crew
      .filter((p) => p.job === "Writer" || p.department === "Writing")
      .map((p) => p.name)
      .join(", ");

    /* ----------------------------------------------------------------------- */
    // tradução manual dos status (na api é inglês padrão)
    const statusMap = {
      Rumored: "Rumor",
      Planned: "Planejado",
      "In Production": "Em produção",
      "Post Production": "Pós-produção",
      Released: "Lançado",
      Canceled: "Cancelado",
    };
    const statusTraduzido = statusMap[data.status] || data.status;

    // tradução do idioma original
    const languageMap = {
      en: "Inglês",
      pt: "Português",
      // adicione aqui outros idiomas
    };
    const originalLanguageCode = data.original_language;
    const languageName =
      languageMap[originalLanguageCode] || originalLanguageCode.toUpperCase();
    /* ----------------------------------------------------------------------- */

    document.getElementById("poster").src =
      "https://image.tmdb.org/t/p/w500" + data.poster_path;
    const titleEl = document.getElementById("movie-title");
    const year = new Date(data.release_date).getFullYear();
    titleEl.innerHTML = `${data.title}&nbsp;<span class="movie-year">(${year})</span>`;

    document.getElementById("genre").textContent = data.genres
      .map((g) => g.name)
      .join(", ");
    document.getElementById("overview").textContent = data.overview;
    document.getElementById("director").textContent = director
      ? director.name
      : "Desconhecido";
    document.getElementById("writers").textContent = writers || "Desconhecido";
    document.getElementById("status").textContent = statusTraduzido;
    document.getElementById("language").textContent = languageName;
    document.getElementById("budget").textContent = data.budget.toLocaleString(
      "pt-BR",
      { style: "currency", currency: "USD" }
    );
    document.getElementById("revenue").textContent =
      data.revenue.toLocaleString("pt-BR", {
        style: "currency",
        currency: "USD",
      });

    // ================== CAST ==================
    // 1. Destruindo o carrossel atual
    const $carousel = $(".cast-carousel");
    if ($carousel.hasClass("owl-loaded")) {
      $carousel.trigger("destroy.owl.carousel");
      $carousel.html(""); // limpa o conteúdo gerado pela Owl
    }

    // 2. Adicionando os atores
    data.credits.cast.slice(0, 10).forEach((actor) => {
      const actorItem = document.createElement("div");
      actorItem.classList.add("actor-item", "text-center", "mx-2");
      actorItem.setAttribute("role", "listitem");

      actorItem.innerHTML = `
    <div class="item rounded-circle overflow-hidden">
      <img
        src="${
          actor.profile_path
            ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
            : "https://via.placeholder.com/185x278?text=Sem+foto"
        }"
        alt="${actor.name}"
        class="img-fluid object-fit-cover"
      />
    </div>
    <h5 class="mt-2 mb-0 actor-name">${actor.name}</h5>
    <h5 class="text-muted actor-character">${actor.character || ""}</h5>
  `;

      $carousel.append(actorItem);
    });

    // 3. Recriando o carrossel
    $carousel.owlCarousel({
      stagePadding: 50,
      loop: false,
      margin: 20,
      nav: false,
      autoWidth: true,
      dots: false,
      responsive: {
        0: {
          items: 1,
        },
        744: {
          items: 3,
        },
        1240: {
          items: 5,
        },
      },
    });
    const $castWrapper = $(".scroller_wrap.cast");
    updateFade($carousel, $castWrapper);
    $carousel.on("changed.owl.carousel", () =>
      updateFade($carousel, $castWrapper)
    );
    $(window).on("resize", () => updateFade($carousel, $castWrapper));
    /* ----------------------------------------------------------------------- */
    // ================== MEDIA - VIDEOS ==================
    const $video = $(".videos-carousel");
    // 1. Destruindo carrossel atual
    if ($video.hasClass("owl-loaded")) {
      $video.trigger("destroy.owl.carousel");
      // limpando conteúdo anterior
      $video.html("");
    }

    // 2. Acessando vídeos disponíveis
    const videos = data.videos.results.filter((v) => v.site === "YouTube");
    // 3. Adicionando os vídeos ao carrossel
    videos.forEach((v) => {
      const item = document.createElement("div");
      item.classList.add("item");
      item.setAttribute("role", "listitem");
      item.innerHTML = `
        <iframe
          src="https://www.youtube.com/embed/${v.key}"
          title="${v.name}"
          frameborder="0"
          allowfullscreen
          class="w-100"
          style="aspect-ratio:16/9;">
        </iframe>`;
      $video.append(item);
    });

    $video.owlCarousel({
      loop: false,
      margin: 20,
      nav: false,
      dots: false,
      autoWidth: true,
      responsive: {
        0: { items: 1 },
        768: { items: 2 },
        1200: { items: 3 },
      },
    });
    // atualizando fade dos videos
    const $videosWrapper = $(".videos-wrap");
    updateFade($video, $videosWrapper);
    $video.on("changed.owl.carousel", () => updateFade($video, $videosWrapper));
    $(window).on("resize", () => updateFade($video, $videosWrapper));

    // 5. Atualizando o span de vídeos excedentes
    const extras = videos.length > 3 ? videos.length - 3 : 0;
    document.getElementById("videos-number").textContent = `(${extras})`;

    // ================== MEDIA - POSTERS ==================
    const $posters = $(".posters-carousel");

    // 1. Destruindo carrossel anterior
    if ($posters.hasClass("owl-loaded")) {
      $posters.trigger("destroy.owl.carousel");
      $posters.html("");
    }
    // 2. Buscando os pôsteres
    const posters = data.images.posters || [];

    // 3. Adicionando pôsteres ao carrossel
    posters.forEach((poster) => {
      const item = document.createElement("div");
      item.classList.add("item");
      item.setAttribute("role", "listitem");

      item.innerHTML = `
        <img
          src="https://image.tmdb.org/t/p/w500${poster.file_path}"
          alt="Pôster do filme"
          class="img-fluid"
        />
      `;

      $posters.append(item);
    });

    // 4. Iniciando carrossel
    $posters.owlCarousel({
      stagePadding: 50,
      loop: false,
      margin: 20,
      nav: false,
      autoWidth: true,
      dots: false,
      responsive: {
        0: { items: 1 },
        744: { items: 2 },
        1240: { items: 4 },
      },
    });

    // atualizando fade dos posters
    const $postersWrapper = $(".posters-wrap");
    updateFade($posters, $postersWrapper);
    $posters.on("changed.owl.carousel", () =>
      updateFade($posters, $postersWrapper)
    );
    $(window).on("resize", () => updateFade($posters, $postersWrapper));

    document.getElementById(
      "posters-number"
    ).textContent = `(${posters.length})`;

    // ================== MEDIA - BACKDROPS ==================
    const $backdrops = $(".backdrops-carousel");

    // 1. Destruindo carrossel anterior (se existir)
    if ($backdrops.hasClass("owl-loaded")) {
      $backdrops.trigger("destroy.owl.carousel");
      $backdrops.html("");
    }

    // 2. Obtendo backdrops
    const backdrops = data.images.backdrops || [];

    // 3. Adicionando cada imagem ao carrossel
    backdrops.forEach((backdrop) => {
      const item = document.createElement("div");
      item.classList.add("item");
      item.setAttribute("role", "listitem");

      item.innerHTML = `
        <img
          src="https://image.tmdb.org/t/p/w780${backdrop.file_path}"
          alt="Imagem de fundo do filme"
          class="img-fluid"
        />
      `;

      $backdrops.append(item);
    });

    // 4. Inicializando Owl Carousel
    $backdrops.owlCarousel({
      stagePadding: 50,
      loop: false,
      margin: 20,
      nav: false,
      autoWidth: true,
      dots: false,
      responsive: {
        0: { items: 1 },
        744: { items: 2 },
        1240: { items: 3 },
      },
    });

    // atualizando fade dos backdrops
    const $backdropsWrapper = $(".backdrops-wrap");
    updateFade($backdrops, $backdropsWrapper);
    $backdrops.on("changed.owl.carousel", () =>
      updateFade($backdrops, $backdropsWrapper)
    );
    $(window).on("resize", () => updateFade($backdrops, $backdropsWrapper));

    // 5. Atualizando o número de imagens no span
    document.getElementById(
      "backdrops-number"
    ).textContent = `(${backdrops.length})`;

    //================== REVIEWS SECTION ==================
    
    const REVIEWS_URL = `https://api.themoviedb.org/3/movie/${MOVIE_ID}/reviews?api_key=${API_KEY}&language=pt-BR`;

    fetch(REVIEWS_URL)
      .then((res) => res.json())
      .then((reviewsData) => {
        const reviews = reviewsData.results || [];

        for (let i = 0; i < 2; i++) {
          const review = reviews[i];
          if (!review) break;

          const reviewCard = document.querySelectorAll(".review")[i];
          if (!reviewCard) continue;
          const reviewText = review.content || "Sem resenha disponível";
          // const truncated =
          //   reviewText.length > 400
          //     ? reviewText.substring(0, 400) + "..."
          //     : reviewText;
          reviewCard.querySelector(".review-body").textContent = reviewText;

          reviewCard.querySelector(".review-person b").textContent =
            review.author || "Anônimo";

          if (review.created_at) {
            const dt = new Date(review.created_at);
            const timeEl = reviewCard.querySelector("time");
            timeEl.textContent = dt.toLocaleDateString("pt-BR");
            timeEl.setAttribute("datetime", dt.toISOString());
          }

          const ratingEl = reviewCard.querySelector(".rating-value");
          if (
            review.author_details &&
            typeof review.author_details.rating === "number"
          ) {
            ratingEl.textContent = review.author_details.rating;
          } else {
            ratingEl.textContent = "10";
          }
        }
      });
  });

/* ----------------------------------------------------------------------- */
// ================== RECOMMENDATIONS SECTION ==================
const RECOMMENDATIONS_URL = `https://api.themoviedb.org/3/movie/${MOVIE_ID}/recommendations?api_key=${API_KEY}&language=pt-BR`;

fetch(RECOMMENDATIONS_URL)
  .then((response) => response.json())
  .then((data) => {
    const $recomen = $(".recomen-carousel");

    // 1. Destruindo carrosel anterior
    if ($recomen.hasClass("owl-loaded")) {
      $recomen.trigger("destroy.owl.carousel");
      $recomen.html("");
    }

    // 2. Pegando filmes recomendados
    const recommended = data.results || [];

    // 3. Adicionando cada filme ao carrossel
    recommended.forEach((movie) => {
      const item = document.createElement("div");
      item.classList.add("recomend-item", "text-center");
      item.setAttribute("role", "listitem");

      // condição para título longo
      const titleClass = movie.title.length > 17 ? "break-title" : "";

      item.innerHTML = `
          <div class="item mb-2">
            <img
              src="${
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                  : "https://via.placeholder.com/300x450?text=Sem+poster"
              }"
              alt="Poster do filme ${movie.title}"
              class="shadow"
            />
          </div>
          <h5 class="movie-name ${titleClass}">${movie.title}</h5>
          <h5 class="rate">${Math.round(movie.vote_average * 10)}%</h5>
        `;

      $recomen.append(item);
    });

    // 4. Iniciando carrosel
    $recomen.owlCarousel({
      stagePadding: 50,
      loop: false,
      margin: 20,
      nav: false,
      autoWidth: true,
      dots: false,
      responsive: {
        0: { items: 1 },
        744: { items: 3 },
        1240: { items: 5 },
      },
    });

    updateFade($recomen, $(".scroller_wrap.fade-recomend"));
    $recomen.on("changed.owl.carousel", () =>
      updateFade($recomen, $(".scroller_wrap.fade-recomend"))
    );
    $(window).on("resize", () =>
      updateFade($recomen, $(".scroller_wrap.fade-recomend"))
    );
  });
/* ----------------------------------------------------------------------- */
