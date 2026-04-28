window.addEventListener('DOMContentLoaded', () => {
  let sviFilmovi = [];
  let kosarica = [];
  let trenutnoFiltrirani = [];
  
  let isCartOpen = false;

  fetch('filmovi.csv')
    .then(res => res.text())
    .then(csv => {
      const rezultat = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true
      });

      sviFilmovi = rezultat.data.map(film => ({
        title: film.title,
        year: Number(film.year),
        genres: film.genres?.replace(/;/g, ', ') || '',
        duration: Number(film.duration),
        rating: parseFloat(film.rating),
        directors: film.directors?.split(';').map(d => d.trim()) || []
      }));

      trenutnoFiltrirani = sviFilmovi.slice(0, 150);
      prikaziTablicu(trenutnoFiltrirani);
    });

  document.getElementById('rating-min').addEventListener('input', e => {
    document.getElementById('rating-value').textContent = e.target.value;
  });

  document.getElementById('filter-button').addEventListener('click', () => {
    const zanr = document.getElementById('genre-filter').value.toLowerCase();
    const godinaMin = parseInt(document.getElementById('year-min').value) || 0;
    const godinaMax = parseInt(document.getElementById('year-max').value) || 9999;
    const minRating = parseFloat(document.getElementById('rating-min').value) || 0;

    trenutnoFiltrirani = sviFilmovi.filter(film => {
      const god = film.year;
      const ocjena = film.rating;
      const sadrziZanr = zanr === '' || film.genres.toLowerCase().includes(zanr);
      return sadrziZanr && god >= godinaMin && god <= godinaMax && ocjena >= minRating;
    });

    primijeniSortiranje();
  });

  document.querySelectorAll('input[name="sort-godina"]').forEach(radio => {
    radio.addEventListener('change', () => {
      primijeniSortiranje();
    });
  });

  document.getElementById('cart-icon').addEventListener('click', () => {
    const cartDropdown = document.getElementById('cart-dropdown');
    isCartOpen = !isCartOpen;
    
    if (isCartOpen) {
      cartDropdown.classList.add('open');
    } else {
      cartDropdown.classList.remove('open');
    }
  });

  document.addEventListener('click', (e) => {
    const cartContainer = document.getElementById('cart-container');
    const cartDropdown = document.getElementById('cart-dropdown');
    
    if (isCartOpen && !cartContainer.contains(e.target)) {
      cartDropdown.classList.remove('open');
      isCartOpen = false;
    }
  });

  document.getElementById('confirm-rent').addEventListener('click', () => {
    if (kosarica.length === 0) return;
    
    alert('You have successfully rented the following movies:\n' + kosarica.map(film => film.title).join('\n'));
    kosarica = [];
    prikaziKosaricu();
    updateCartCounter();
    
    document.getElementById('cart-dropdown').classList.remove('open');
    isCartOpen = false;
  });

  function primijeniSortiranje() {
    const sortValue = document.querySelector('input[name="sort-godina"]:checked')?.value;

    if (sortValue === 'asc') {
      trenutnoFiltrirani.sort((a, b) => a.year - b.year);
    } else if (sortValue === 'desc') {
      trenutnoFiltrirani.sort((a, b) => b.year - a.year);
    }

    prikaziTablicu(trenutnoFiltrirani);
  }

  function prikaziTablicu(filmovi) {
    const tbody = document.querySelector('#filmovi-tablica tbody');
    tbody.innerHTML = '';

    for (const film of filmovi) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${film.title}</td>
        <td>${film.year}</td>
        <td>${film.genres}</td>
        <td>${film.duration}</td>
        <td>${film.rating}</td>
        <td>${film.directors.join(', ')}</td>
        <td><button class="add-to-cart" data-title="${film.title}">Dodaj u košaricu</button></td>
      `;
      tbody.appendChild(row);
    }

    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const filmTitle = e.target.getAttribute('data-title');
        const film = filmovi.find(f => f.title === filmTitle);
        if (film && !kosarica.some(item => item.title === film.title)) {
          kosarica.push(film);
          prikaziKosaricu();
          updateCartCounter();
          
          showNotification(`"${film.title}" added to cart`);
        }
      });
    });
  }

  function prikaziKosaricu() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    if (kosarica.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
      document.getElementById('confirm-rent').disabled = true;
      return;
    }

    kosarica.forEach((film, index) => {
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="cart-item-info">
          <div class="cart-item-title">${film.title}</div>
          <div class="cart-item-details">${film.year} | ${film.genres}</div>
        </div>
        <button class="remove-from-cart" data-index="${index}">×</button>
      `;
      cartItems.appendChild(item);
    });

    const removeButtons = document.querySelectorAll('.remove-from-cart');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(e.target.getAttribute('data-index'));
        const removedMovie = kosarica[index];
        kosarica.splice(index, 1);
        prikaziKosaricu();
        updateCartCounter();
        
        showNotification(`"${removedMovie.title}" removed from cart`);
      });
    });

    document.getElementById('confirm-rent').disabled = false;
  }
  
  function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    counter.textContent = kosarica.length;
    
    if (kosarica.length > 0) {
      counter.classList.add('has-items');
    } else {
      counter.classList.remove('has-items');
    }
  }
  
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }
  
  updateCartCounter();
});