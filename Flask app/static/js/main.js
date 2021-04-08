
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach(e => e.addEventListener(type, listener))
    } else {
      select(el, all).addEventListener(type, listener)
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    if (!header.classList.contains('header-scrolled')) {
      offset -= 10
    }

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled')
      } else {
        selectHeader.classList.remove('header-scrolled')
      }
    }
    window.addEventListener('load', headerScrolled)
    onscroll(document, headerScrolled)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
  })

  /**
   * Mobile nav dropdowns activate
   */
  on('click', '.navbar .dropdown > a', function(e) {
    if (select('#navbar').classList.contains('navbar-mobile')) {
      e.preventDefault()
      this.nextElementSibling.classList.toggle('dropdown-active')
    }
  }, true)

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let navbar = select('#navbar')
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Clients Slider
   */
  new Swiper('.clients-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 2,
        spaceBetween: 40
      },
      480: {
        slidesPerView: 3,
        spaceBetween: 60
      },
      640: {
        slidesPerView: 4,
        spaceBetween: 80
      },
      992: {
        slidesPerView: 6,
        spaceBetween: 120
      }
    }
  });

  

  /**
   * Testimonials slider
   */
  new Swiper('.testimonials-slider', {
    speed: 600,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 1,
        spaceBetween: 40
      },

      1200: {
        slidesPerView: 3,
      }
    }
  });

  /**
   * Animation on scroll
   */
  function aos_init() {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', () => {
    aos_init();
  });

})();



/*=======================
accounts card
=========================
*/

var Flipper = (function() {
  var card = $('.card');
  var flipper = card.find('.card__flipper');
  var win = $(window);
  
  var flip = function(thisCard) {
    // var thisCard = $(this);
    var thisFlipper = thisCard.find('.card__flipper');

    if (card.hasClass('active')) unflip();
        
    thisCard.css({'z-index': '3'}).addClass('active');
    
    thisFlipper.css({
      'transform': 'rotateY(180deg) scale(1)',
      '-webkit-transform': 'rotateY(180deg) scale(1)',
      '-ms-transform': 'rotateY(180deg) scale(1)'
    }).addClass('active');
    
    return false;
  };
  
  var unflip = function(e) {
    card.css({'z-index': '1'}).removeClass('active');
    flipper.css({
      'transform': 'none',
      '-webkit-transform': 'none',
      '-ms-transform': 'none'
    }).removeClass('active');
  };
  
  var bindActions = function() {
    card.on('click', function(){
      if(flipper.hasClass("active")){
        unflip();
      }
      else{
        flip($(this));
      }
    });
    // win.on('click', unflip);
  }
  
  var init = function() {
    bindActions();
  };
  
  return {
    init: init
  };
  
}());

Flipper.init();


let getStartedBtn = document.querySelectorAll(".card__back .btn-get-started");

for(let i=0; i<getStartedBtn.length; i++){
  getStartedBtn[i].addEventListener("click", function(event){
    event.stopPropagation();
  })
}


/* ===============
creditcard animation
==================
*/

/* Store the element in el */
let el = document.getElementsByClassName('creditcard')

if(el[0] !== undefined){
  
/* Get the height and width of the element */
const height = el[0].clientHeight
const width = el[0].clientWidth

/*
  * Add a listener for mousemove event
  * Which will trigger function 'handleMove'
  * On mousemove
  */
for(let i=0; i<el.length; i++){
  el[i].addEventListener('mousemove', handleMove);
}

/* Define function a */
function handleMove(e) {
  /*
    * Get position of mouse cursor
    * With respect to the element
    * On mouseover
    */
  /* Store the x position */
  const xVal = e.layerX
  /* Store the y position */
  const yVal = e.layerY

  
  /*
    * Calculate rotation valuee along the Y-axis
    * Here the multiplier 20 is to
    * Control the rotation
    * You can change the value and see the results
    */
  const yRotation = 20 * ((xVal - width / 2) / width)
  
  /* Calculate the rotation along the X-axis */
  const xRotation = -20 * ((yVal - height / 2) / height)
  
  /* Generate string for CSS transform property */
  const string = 'perspective(500px) scale(1.1) rotateX(' + xRotation + 'deg) rotateY(' + yRotation + 'deg)'
  
  /* Apply the calculated transformation */
  this.style.transform = string
}


for(let i=0; i<el.length; i++){
  el[i].addEventListener('mouseout', function() {
    this.style.transform = 'perspective(500px) scale(1) rotateX(0) rotateY(0)'
    this.style.boxShadow = '0px 0px 30px rgba(0,0,0, 0.6)';
  });

  el[i].addEventListener('mousedown', function(event) {
    this.style.transform = 'perspective(500px) scale(0.9) rotateX(0) rotateY(0)';
    this.style.boxShadow = 'none';
  });

  el[i].addEventListener('mouseup', function(event) {
    this.style.transform = 'perspective(500px) scale(1.1) rotateX(0) rotateY(0)';
    this.style.boxShadow = 'none';
  });

  el[i].addEventListener("click", function(event){
    this.classList.toggle("clicked");
    event.stopPropagation();
  });
}
}

// Cross button
let close = document.querySelector("i.fa.fa-times");

if (close !== null){
  close.style.cursor = "pointer"; 

  close.addEventListener("click", function(){
    document.querySelector("div.alert").remove();
  })
}







