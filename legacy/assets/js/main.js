/*=============== SHOW MENU ===============*/

    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav-list');

    navToggle.addEventListener('click', () => {
        navList.classList.toggle('active');
    });


/*=============== REMOVE MENU MOBILE ===============*/


/*=============== ADD BLUR HEADER ===============*/


/*=============== EMAIL JS ===============*/
const contactForm = document.getElementById('contact-form'),
    contactMessage = document.getElementById('contact-message')

const sendEmail = (e) =>{
    e.preventDefault()
    
    emailjs.sendForm('service_p6udvnd', 'template_eur7nel', '#contact-form', '')
        .then(() => {
            contactMessage.textContent = 'Message sent successfully!'

            setTimeout(() => {
                contactMessage.textContent = ''
            }, 5000)

            contactForm.reset()
        }, () =>{
            contactMessage.textContent = 'Message failed to send!'
        })
}

contactForm.addEventListener('submit', sendEmail)


/*=============== SHOW SCROLL UP ===============*/ 


/*=============== SCROLL SECTIONS ACTIVE LINK ===============*/
const sections= document.querySelectorAll('section[id]')

const scrollActive =()=>{
    const scrollDown=window.scrollY

    sections.forEach(current =>{
        const sectionHeight =current.offsetHeight,
        sectionTop =current.offsetTop - 58,
        sectionId= current.getAttribute('id'),
        sectionsClass =document.querySelector('.nav__list a[href*=' + sectionId +']')
        if(scrollDown> sectionTop && scrollDown <= sectionTop +sectionHeight){
            sectionsClass.classList.add('active-link')
        }else{
             sectionsClass.classList.remove('active-link')
        }
    })
}
window.addEventListener('scroll',scrollActive)

/*=============== SCROLL REVEAL ANIMATION ===============*/