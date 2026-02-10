const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d') // c = contex

const stage = {
    width: 0,
    height: 0,
    dpr: 1
}

function resizeStage() {
    const { width, height } = canvas.getBoundingClientRect()
    stage.dpr = window.devicePixelRatio || 1
    stage.width = width
    stage.height = height
    canvas.width = Math.floor(width * stage.dpr)
    canvas.height = Math.floor(height * stage.dpr)
    c.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0)
}

window.addEventListener('resize', resizeStage)
resizeStage()

const gravity = 0.7

const player1HealthFill = document.querySelector('#player1-health')
const player2HealthFill = document.querySelector('#player2-health')

// subtracts health
function clamp(number, min, max) {
    return Math.max(min, Math.min(max, number))
}

function syncHealthUI() {
    if (player1HealthFill) player1HealthFill.style.width = `${clamp(player1.health, 0, 100)}%`
    if (player2HealthFill) player2HealthFill.style.width = `${clamp(player2.health, 0, 100)}%`
}

class Sprite {
    constructor({ position, velocity, color = 'red', offset, health = 100 }) {
        this.position = position,
        this.velocity = velocity // left, right, up, down
        this.width = 50
        this.height = 150
        this.lastKey
        this.attackBox = {
            position:{
                x: this.position.x,
                y: this.position.y
            },
            offset,
            width: 100,
            height: 50
        }
        this.color = color
        this.isAttacking
        this.health = health
    }

    draw() {
        c.fillStyle = this.color
        c.fillRect(this.position.x, this.position.y, this.width, 150)
        
        // attack box
        if (this.isAttacking) {    
            c.fillStyle = 'yellow'
            c.fillRect(
                this.attackBox.position.x, 
                this.attackBox.position.y, 
                this.attackBox.width, 
                this.attackBox.height
            )
        }
    }

    update() {
        this.draw()
        this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        this.attackBox.position.y = this.position.y

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        if (this.position.y + this.height + this.velocity.y >= stage.height) {
            this.velocity.y = 0
        } else {
            this.velocity.y += gravity
        }
    }

    attack() {
        this.isAttacking = true;
        setTimeout(() => {
            this.isAttacking = false
        }, 100)
    }
}

const player1 = new Sprite ({
    position: {
        x: 0,
        y: 0
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 0,
        y: 0
    }
})

const player2 = new Sprite ({
    position: {
        x: 400,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: -50,
        y: 0
    }
})

syncHealthUI()

const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    ArrowRight: {
        pressed: false
    },
    ArrowLeft: {
        pressed: false
    }
}

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x && 
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
    )
}


function animate() {
    window.requestAnimationFrame(animate)
    c.fillStyle = 'black'
    c.fillRect(0, 0, stage.width, stage.height)
    player1.update()    
    player2.update()

    player1.velocity.x = 0; // stops player
    player2.velocity.x = 0;

    // player1 movement
    if (keys.a.pressed && player1.lastKey == 'a') {
        player1.velocity.x = -5;
    } else if (keys.d.pressed && player1.lastKey == 'd') {
        player1.velocity.x = 5;
    }

    // player2 movement
    if (keys.ArrowLeft.pressed && player2.lastKey == 'ArrowLeft') {
        player2.velocity.x = -5;
    } else if (keys.ArrowRight.pressed && player2.lastKey == 'ArrowRight') {
        player2.velocity.x = 5;
    }

    // detect for collision
    if (rectangularCollision({
        rectangle1: player1,
        rectangle2: player2
    }) && player1.isAttacking) {
            player1.isAttacking = false
            player2.health = clamp(player2.health - 10, 0, 100)
            syncHealthUI()
    }
    if (rectangularCollision({
        rectangle1: player2,
        rectangle2: player1
    }) && player2.isAttacking) {
            player2.isAttacking = false
            player1.health = clamp(player1.health - 10, 0, 100)
            syncHealthUI()
    }
}

animate()

window.addEventListener('keydown', (event) =>  {
    switch (event.key) {
        // player 1
        case 'd': 
            keys.d.pressed = true;
            player1.lastKey = 'd'
            break;
        case 'a': 
            keys.a.pressed = true;
            player1.lastKey = 'a'
            break;
        case 'w': // jump
            player1.velocity.y = -15
            break;
        case 'f':
            player1.attack()
            break

        // player 2
        case 'ArrowRight': 
            keys.ArrowRight.pressed = true;
            player2.lastKey = 'ArrowRight'
            break;
        case 'ArrowLeft': 
            keys.ArrowLeft.pressed = true;
            player2.lastKey = 'ArrowLeft'
            break;
        case 'ArrowUp': // jump
            player2.velocity.y = -15
            break;
        case '/':
            player2.attack()
            break
    }

})

window.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
    // player2 keys
    switch (event.key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
    }
})
