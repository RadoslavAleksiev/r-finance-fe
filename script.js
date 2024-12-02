// Smooth Scroll for Navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Dynamic Year in Footer
document.getElementById('year').textContent = new Date().getFullYear();

// Animated Scroll-In Effects
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('scroll-in');
        }
    });
});

document.querySelectorAll('.feature-item').forEach(item => observer.observe(item));

// Modal Pop-Up for Team Members
const modal = document.getElementById("team-modal");
const closeModal = document.getElementsByClassName("close")[0];

document.querySelectorAll('.team-member').forEach(member => {
    member.addEventListener('click', () => {
        const memberName = member.dataset.member;
        document.getElementById('modal-content-inner').innerHTML = `<h3>${memberName}</h3><p>Details about ${memberName}</p>`;
        modal.style.display = "block";
    });
});

closeModal.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Back-to-Top Button
let mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}
