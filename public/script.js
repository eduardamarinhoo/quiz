const slides = document.querySelector('.slides')
const images = document.querySelectorAll('.slides img')

const prev = document.querySelector('.prev')
const next = document.querySelector('.next')

let index = 0

function updateSlide(){
slides.style.transform = `translateX(${-index * 100}vw)`
}

next.onclick = () => {
if(index < images.length-1){
index++
updateSlide()
}
}

prev.onclick = () => {
if(index > 0){
index--
updateSlide()
}
}

// teclado

document.addEventListener("keydown",(e)=>{

if(e.key === "ArrowRight"){
next.click()
}

if(e.key === "ArrowLeft"){
prev.click()
}

})

// swipe mobile

let startX = 0

slides.addEventListener("touchstart",(e)=>{
startX = e.touches[0].clientX
})

slides.addEventListener("touchend",(e)=>{
let endX = e.changedTouches[0].clientX
let diff = startX - endX

if(diff > 50) next.click()
if(diff < -50) prev.click()

})