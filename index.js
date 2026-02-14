const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d') // c = contex

// ---------------------- Game State -----------------------
let gameState = 'title' // 'title', 'playing', 'gameover'
let animationId = null
let winner = null

// ---------------------- Screen Elements -----------------------
const titleScreen = document.getElementById('titleScreen')
const slideshowScreen = document.getElementById('slideshowScreen')
const slideshowImage = document.getElementById('slideshowImage')
const deathScreen = document.getElementById('deathScreen')
const rematchButton = document.getElementById('rematchButton')
const titleButton = document.getElementById('titleButton')
const deathTitle = document.getElementById('deathTitle')
const deathImage = document.getElementById('deathImage')

// ---------------------- Slideshow Configuration -----------------------
// Add your slideshow images here for each winner
const slideshowImages = {
    'Player 1': [
        './imgs/Cathlyn/rose.gif',  // First image (zoomed in)
        './imgs/Noah/love.gif'      // Second image (zooms out)
    ],
    'Player 2': [
        './imgs/Noah/rose.gif',     // First image (zoomed in)
        './imgs/Cathlyn/love.gif'   // Second image (zooms out)
    ]
}

// Slideshow timing configuration (in milliseconds)
const slideshowTiming = {
    suspensePause: 6000,        // Pause on game screen before slideshow (adds suspense)
    firstImageDuration: 5500,   // How long to show the first zoomed-in image
    secondImageDuration: 3000,  // How long to show the second zoomed-out image
    zoomOutDuration: 1000       // How long the zoom-out animation takes
}

// ---------------------- BGM & Audio -----------------------
const titleBgm = document.getElementById('titleBgm')
const deathBgm = document.getElementById('rizzbgm')

const DEFAULT_VOLUME = 0.5
const MUSIC_MIX = 0.4  // music volume multiplier
const SFX_MIX = 0.7    // sfx volume multiplier
let userVolume = DEFAULT_VOLUME
let isMuted = false

function applyVolume() {
    if (titleBgm) {
        titleBgm.volume = Math.min(1, userVolume * MUSIC_MIX)
        titleBgm.muted = isMuted
    }
    if (deathBgm) {
        deathBgm.volume = Math.min(1, userVolume * MUSIC_MIX)
        deathBgm.muted = isMuted
    }
}

function playBgm(bgmElement) {
    if (!bgmElement || isMuted) return
    bgmElement.currentTime = 0
    bgmElement.loop = true
    applyVolume()
    bgmElement.play().catch(() => {})
}

function stopBgm(bgmElement) {
    if (!bgmElement) return
    bgmElement.pause()
    bgmElement.currentTime = 0
}

// Initialize volumes
applyVolume()

// ---------------------- Audio -----------------------
const sfx = {
    attack: new Audio('./audio/attack.mp3'),
    hit: new Audio('./audio/hit.mp3'),
    jump: new Audio('./audio/jump.mp3'),
    walk: new Audio('./audio/footsteps.wav')
}

sfx.attack.playbackRate = 1.1

sfx.walk.playbackRate = 1

sfx.jump.playbackRate = 2

function playSfx(sound) {
    if (!sound || isMuted) return
    sound.currentTime = 0
    sound.volume = Math.min(1, userVolume * SFX_MIX)
    sound.play().catch(() => {})
}
// ---------------------------------------------------

const stage = {
    width: 0,
    height: 0,
    dpr: 1,
    bounds: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    },
    worldBounds: {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    }
}

function resizeStage() {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width === 0 || height === 0) return
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
window.DEBUG_HITBOXES = true

const player1HealthFill = document.querySelector('#player1-health')
const player2HealthFill = document.querySelector('#player2-health')
const hud = document.querySelector('.hud')

// subtracts health
function clamp(number, min, max) {
    return Math.max(min, Math.min(max, number))
}

function syncHealthUI() {
    if (player1HealthFill) player1HealthFill.style.width = `${clamp(player1.health, 0, 100)}%`
    if (player2HealthFill) player2HealthFill.style.width = `${clamp(player2.health, 0, 100)}%`
}

const background = new Sprite({
    position: {
        x: 0,
        y: 0
    },
    imgSrc: './imgs/fighting arena.png'
})

let player1, player2

function initializePlayers() {
    player1 = new Fighter({
        hitbox: {
            offset: { x: 60, y: -100 }, // move the red box
            width: 250,
            height: 360
        },

        position: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
        imgSrc: './imgs/Cathlyn/Right.png',
        framesMax: 1,
        attackBox: {
            offset: { 
                left: {x: -110, y: -130 },
                right: {x: 0, y: -130 },
            },
            width: 150,
            height: 12
        },
        scale: 0.8,
        offset: { x: 100, y: 130 },
        sprites: {
            idle: { imageSrc: './imgs/Cathlyn/Right.png', framesMax: 1 },
            idleLeft: { imageSrc: './imgs/Cathlyn/Left.png', framesMax: 1 },
            run: { imageSrc: './imgs/Cathlyn/WalkRight.png', framesMax: 1 },
            runLeft: { imageSrc: './imgs/Cathlyn/WalkLeft.png', framesMax: 1 },
            jump: { imageSrc: './imgs/Cathlyn/JumpRight.png', framesMax: 1 },
            jumpLeft: { imageSrc: './imgs/Cathlyn/JumpLeft.png', framesMax: 1 },
            fall: { imageSrc: './imgs/Cathlyn/JumpRight.png', framesMax: 1 },
            fallLeft: { imageSrc: './imgs/Cathlyn/JumpLeft.png', framesMax: 1 },
            attack1: { imageSrc: './imgs/Cathlyn/AttackRight.png', framesMax: 1 },
            attack1Left: { imageSrc: './imgs/Cathlyn/AttackLeft.png', framesMax: 1 },
            takeHit: { imageSrc: './imgs/Cathlyn/HitLeft.png', framesMax: 1 },
            takeHitRight: { imageSrc: './imgs/Cathlyn/HitRight.png', framesMax: 1 },
            death: { imageSrc: './imgs/Cathlyn/deathLeft.png', framesMax: 1 },
            deathRight: { imageSrc: './imgs/Cathlyn/deathRight.png', framesMax: 1 }
        },
        attackDuration: 350,
        attackCooldown: 525,
        hitDuration: 350
    })

    player2 = new Fighter({
        hitbox: {
            offset: { x: 250, y: -140 }, // move the red box
            width: 250,
            height: 360
        },
        position: { x: 1300, y: 100 },
        velocity: { x: 0, y: 0 },
        facing: -1,
        attackBox: {
            offset: { 
                left: {x: -310, y: -180 },
                right: {x: 200, y: -180 }
            },
            width: 150,
            height: 12
        },
        imgSrc: './imgs/Noah/NoahLeft.png',
        framesMax: 1,
        scale: 0.8,
        offset: { x: -100, y: 160 },
        sprites: {
            idle: { imageSrc: './imgs/Noah/NoahLeft.png', framesMax: 1 },
            idleRight: { imageSrc: './imgs/Noah/NoahRight.png', framesMax: 1 },
            run: { imageSrc: './imgs/Noah/NoahWalkLeft.png', framesMax: 1 },
            runRight: { imageSrc: './imgs/Noah/NoahWalkRight.png', framesMax: 1 },
            jump: { imageSrc: './imgs/Noah/NoahJumpLeft.png', framesMax: 1 },
            jumpRight: { imageSrc: './imgs/Noah/NoahJumpRight.png', framesMax: 1 },
            fall: { imageSrc: './imgs/Noah/NoahJumpLeft.png', framesMax: 1 },
            fallRight: { imageSrc: './imgs/Noah/NoahJumpRight.png', framesMax: 1 },
            attack1: { imageSrc: './imgs/Noah/NoahAttackLeft.png', framesMax: 1 },
            attack1Right: { imageSrc: './imgs/Noah/NoahAttackRight.png', framesMax: 1 },
            takeHit: { imageSrc: './imgs/Noah/HitLeft.png', framesMax: 1 },
            takeHitRight: { imageSrc: './imgs/Noah/HitRight.png', framesMax: 1 },
            death: { imageSrc: './imgs/Noah/deathLeft.png', framesMax: 1 },
            deathRight: { imageSrc: './imgs/Noah/deathRight.png', framesMax: 1 }
        },
        attackDuration: 350,
        attackCooldown: 525,
        hitDuration: 350
    })
}

initializePlayers()
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

const controlsLegendState = {
    p1HasMoved: false,
    p2HasMoved: false
}

function getBodyHitbox(rect) {
    if (rect?.hitbox) return rect.hitbox
    return { position: rect.position, width: rect.width, height: rect.height }
}

function rectangularCollision({ rectangle1, rectangle2 }) {
    const target = getBodyHitbox(rectangle2)
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= target.position.x && 
        rectangle1.attackBox.position.x <= target.position.x + target.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= target.position.y &&
        rectangle1.attackBox.position.y <= target.position.y + target.height
    )
}

function drawKeyIcon(x, y, label, size, fontSize, scale = 1, glowAlpha = 0) {
    const cx = x + size / 2
    const cy = y + size / 2

    c.save()
    c.translate(cx, cy)
    c.scale(scale, scale)

    if (glowAlpha > 0) {
        const glowSize = size + 10
        c.save()
        c.globalAlpha *= glowAlpha
        c.fillStyle = 'white'
        c.fillRect(-glowSize / 2, -glowSize / 2, glowSize, glowSize)
        c.restore()
    }

    c.fillStyle = 'white'
    c.fillRect(-size / 2, -size / 2, size, size)

    c.fillStyle = '#2c3e50'
    c.font = `bold ${fontSize}px monospace`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.fillText(label, 0, 1)
    c.restore()
}

function drawControlsLegend() {
    const compact = stage.width < 720
    const keySize = compact ? 22 : 25
    const keyFontSize = compact ? 14 : 16
    const fontSize = compact ? 14 : 16
    const marginX = 16
    const marginBottom = compact ? 18 : 22
    const rowGap = compact ? 10 : 12

    const keyGap = compact ? 6 : 8
    const textGap = compact ? 8 : 10
    const segmentGap = compact ? 14 : 18
    const minGapBetweenRows = compact ? 16 : 24

    const bounds = stage.bounds ?? { x: 0, y: 0, width: stage.width, height: stage.height }
    const actionFont = `${fontSize}px monospace`
    const now = performance.now()
    const pulseDuration = 1150
    const pulse = 0.5 - 0.5 * Math.cos((now / pulseDuration) * Math.PI * 2)
    const iconScale = 1 + pulse * 0.06
    const rowAlpha = 0.82 + pulse * 0.18
    const glowAlpha = 0.08 + pulse * 0.12

    const p1 = {
        segments: [
            { keys: ['A', 'D'], action: 'move' },
            { keys: ['W'], action: 'jump' },
            { keys: ['F'], action: 'attack' }
        ]
    }

    const p2 = {
        segments: [
            { keys: ['←', '→'], action: 'move' },
            { keys: ['↑'], action: 'jump' },
            { keys: ['/'], action: 'attack' }
        ]
    }

    if (controlsLegendState.p1HasMoved && controlsLegendState.p2HasMoved) return

    const baseY = bounds.y + bounds.height - marginBottom - keySize
    let yP1 = baseY
    let yP2 = baseY

    function measureRowWidth(row) {
        c.font = actionFont
        let segmentsWidth = 0
        row.segments.forEach((segment, index) => {
            const keysWidth = segment.keys.length * keySize + Math.max(0, segment.keys.length - 1) * keyGap
            const actionWidth = c.measureText(segment.action).width
            segmentsWidth += keysWidth + textGap + actionWidth
            if (index !== row.segments.length - 1) segmentsWidth += segmentGap
        })

        return segmentsWidth
    }

    function drawRow(row, y, align) {
        c.save()
        c.textBaseline = 'middle'
        c.globalAlpha *= rowAlpha

        const rowWidth = measureRowWidth(row)
        let x = align === 'right'
            ? bounds.x + bounds.width - marginX - rowWidth
            : bounds.x + marginX
        if (x < bounds.x + marginX) x = bounds.x + marginX

        c.font = actionFont
        row.segments.forEach((segment, segmentIndex) => {
            segment.keys.forEach((keyLabel, keyIndex) => {
                drawKeyIcon(x, y, keyLabel, keySize, keyFontSize, iconScale, glowAlpha)
                x += keySize
                if (keyIndex !== segment.keys.length - 1) x += keyGap
            })

            x += textGap
            c.fillStyle = 'white'
            c.textAlign = 'left'
            c.fillText(segment.action, x, y + keySize / 2)
            x += c.measureText(segment.action).width

            if (segmentIndex !== row.segments.length - 1) x += segmentGap
        })

        c.restore()
    }

    c.save()
    const p1Visible = !controlsLegendState.p1HasMoved
    const p2Visible = !controlsLegendState.p2HasMoved

    if (p1Visible && p2Visible) {
        const p1Width = measureRowWidth(p1)
        const p2Width = measureRowWidth(p2)
        const p1EndX = bounds.x + marginX + p1Width
        const p2StartX = bounds.x + bounds.width - marginX - p2Width

        if (p1EndX + minGapBetweenRows > p2StartX) {
            yP1 = baseY - keySize - rowGap
            yP2 = baseY
        }
    }

    if (p1Visible) drawRow(p1, yP1, 'left')
    if (p2Visible) drawRow(p2, yP2, 'right')
    c.restore()
}

function checkGameOver() {
    if (player1.health <= 0 && !player1.dead) {
        player1.dead = true
        winner = 'Player 2'
        playSlideshow()
    } else if (player2.health <= 0 && !player2.dead) {
        player2.dead = true
        winner = 'Player 1'
        playSlideshow()
    }
}

function playSlideshow() {
    gameState = 'gameover'
    
    // Play death/victory music immediately
    playBgm(deathBgm)
    
    // Get slideshow images for the winner
    const images = slideshowImages[winner] || []
    
    console.log('Starting slideshow for', winner, 'with images:', images)
    console.log('Suspense pause:', slideshowTiming.suspensePause, 'ms')
    
    if (images.length === 0) {
        console.log('No slideshow images, going straight to death screen')
        showDeathScreen()
        return
    }
    
    // SUSPENSE PAUSE - Game screen stays frozen while music plays
    // After the pause, transition to slideshow
    setTimeout(() => {
        console.log('Suspense pause over, showing slideshow')
        
        // Show slideshow screen with black background
        slideshowScreen.style.display = 'flex'
        slideshowScreen.style.backgroundColor = '#000'
        slideshowScreen.style.animation = 'fadeIn 0.4s ease'
        
        // FIRST IMAGE - Zoomed in
        console.log('Showing first image (zoomed in):', images[0])
        slideshowImage.src = images[0]
        slideshowImage.className = 'slideshow-image zoomed-in'
        
        // After first image duration, show second image with zoom out
        setTimeout(() => {
            if (images.length > 1) {
                console.log('Showing second image (zooming out):', images[1])
                slideshowImage.src = images[1]
                slideshowImage.className = 'slideshow-image zoom-out'
                
                // After second image duration, fade out then show death screen
                setTimeout(() => {                    
                    setTimeout(() => {
                        slideshowScreen.style.display = 'none'
                        slideshowScreen.style.animation = '' // Reset animation
                        showDeathScreen()
                    }, 600) // Match fadeOut duration
                }, slideshowTiming.secondImageDuration)
            } else {
                // Only one image, fade out then go to death screen 
                setTimeout(() => {
                    slideshowScreen.style.display = 'none'
                    slideshowScreen.style.animation = ''
                    showDeathScreen()
                }, 600)
            }
        }, slideshowTiming.firstImageDuration)
        
    }, slideshowTiming.suspensePause) // Delay the slideshow start for suspense
}

function showDeathScreen() {
    console.log('Showing death screen for', winner)
    
    // Set winner image (use last slideshow image)
    const images = slideshowImages[winner] || []
    const finalImage = images[images.length - 1] || (winner === 'Player 1' ? './imgs/Cathlyn/rose.gif' : './imgs/Noah/rose.gif')
    console.log('Setting final image:', finalImage)
    deathImage.src = finalImage
    
    // Show death screen with animation
    deathScreen.style.display = 'flex'
    deathScreen.style.animation = 'fadeIn 0.4s ease'
}

function resetGame() {
    // Stop death music
    stopBgm(deathBgm)
    
    // Reset game state
    gameState = 'playing'
    winner = null
    
    // Reset keys
    keys.a.pressed = false
    keys.d.pressed = false
    keys.ArrowLeft.pressed = false
    keys.ArrowRight.pressed = false
    
    // Reset controls legend
    controlsLegendState.p1HasMoved = false
    controlsLegendState.p2HasMoved = false
    
    // Reinitialize players
    initializePlayers()
    syncHealthUI()
    
    // Hide death screen
    deathScreen.style.display = 'none'
}

function returnToTitle() {
    // Stop death music
    stopBgm(deathBgm)
    
    // Reset game state
    gameState = 'title'
    winner = null
    
    // Reset keys
    keys.a.pressed = false
    keys.d.pressed = false
    keys.ArrowLeft.pressed = false
    keys.ArrowRight.pressed = false
    
    // Reset controls legend
    controlsLegendState.p1HasMoved = false
    controlsLegendState.p2HasMoved = false
    
    // Reinitialize players
    initializePlayers()
    syncHealthUI()
    
    // Hide death screen and show title screen
    deathScreen.style.display = 'none'
    titleScreen.style.display = 'flex'
    titleScreen.style.animation = 'fadeIn 0.4s ease'
    
    // Play title music
    playBgm(titleBgm)
}

function startGame() {
    // Stop title music
    stopBgm(titleBgm)
    
    setTimeout(() => {
        gameState = 'playing'
        titleScreen.style.display = 'none'
        // Reset animation for next time
        titleScreen.style.animation = 'fadeIn 0.4s ease'
        resetGame()
    }, 500) // Match the fadeOut duration
}

// Button event listeners
rematchButton.addEventListener('click', resetGame)
titleButton.addEventListener('click', returnToTitle)

function animate() {
    animationId = window.requestAnimationFrame(animate)
    
    c.fillStyle = 'black'
    c.fillRect(0, 0, stage.width, stage.height)

    const imageWidth = background.image?.naturalWidth || stage.width
    const imageHeight = background.image?.naturalHeight || stage.height
    const scale = Math.min(stage.width / imageWidth, stage.height / imageHeight) || 1
    const drawWidth = imageWidth * scale
    const drawHeight = imageHeight * scale
    const drawX = (stage.width - drawWidth) / 2
    const drawY = (stage.height - drawHeight) / 2

    stage.bounds = { x: drawX, y: drawY, width: drawWidth, height: drawHeight }
    stage.worldBounds = { x: 0, y: 0, width: imageWidth, height: imageHeight }

    if (hud) {
        const hudWidth = Math.min(1200, Math.max(0, stage.bounds.width - 32))
        hud.style.left = `${stage.bounds.x + stage.bounds.width / 2}px`
        hud.style.top = `${stage.bounds.y + 16}px`
        hud.style.width = `${hudWidth}px`
    }

    c.save()
    c.translate(drawX, drawY)
    c.scale(scale, scale)
    background.update()
    player1.update()    
    player2.update()
    c.restore()

    // Only process game logic if playing
    if (gameState !== 'playing') {
        return
    }

    player1.velocity.x = 0; // stops player
    player2.velocity.x = 0;

    // player1 movement
    if (!player1.isMovementLocked()) {
        if (keys.a.pressed && player1.lastKey == 'a') {
            player1.velocity.x = -5;
        } else if (keys.d.pressed && player1.lastKey == 'd') {
            player1.velocity.x = 5;
        }
    }

    // player2 movement
    if (!player2.isMovementLocked()) {
        if (keys.ArrowLeft.pressed && player2.lastKey == 'ArrowLeft') {
            player2.velocity.x = -5;
        } else if (keys.ArrowRight.pressed && player2.lastKey == 'ArrowRight') {
            player2.velocity.x = 5;
        }
    }

    const prevFacing1 = player1.facing
    const prevFacing2 = player2.facing

    if (!player1.isMovementLocked()) {
        if (keys.a.pressed || keys.d.pressed) {
            if (keys.a.pressed && keys.d.pressed) {
                if (player1.lastKey === 'a') player1.facing = -1
                else if (player1.lastKey === 'd') player1.facing = 1
            } else if (keys.a.pressed) {
                player1.facing = -1
            } else if (keys.d.pressed) {
                player1.facing = 1
            }
        }
    }
    if (!player2.isMovementLocked()) {
        if (keys.ArrowLeft.pressed || keys.ArrowRight.pressed) {
            if (keys.ArrowLeft.pressed && keys.ArrowRight.pressed) {
                if (player2.lastKey === 'ArrowLeft') player2.facing = -1
                else if (player2.lastKey === 'ArrowRight') player2.facing = 1
            } else if (keys.ArrowLeft.pressed) {
                player2.facing = -1
            } else if (keys.ArrowRight.pressed) {
                player2.facing = 1
            }
        }
    }
    if (player1.facing !== prevFacing1 && !player1.isAttacking) {
        player1.switchSprite(player1.currentState)
    }
    if (player2.facing !== prevFacing2 && !player2.isAttacking) {
        player2.switchSprite(player2.currentState)
    }

    const updateState = (fighter) => {
        if (fighter.isAttacking || fighter.dead || fighter.currentState === 'takeHit') return
        let next = fighter.currentState
        if (!fighter.onGround) {
            next = fighter.velocity.y < 0 ? 'jump' : 'fall'
        } else if (fighter.velocity.x !== 0) {
            next = 'run'
        } else {
            next = 'idle'
        }
        if (next !== fighter.currentState) {
            fighter.currentState = next
            fighter.switchSprite(next)
        }
    }
    updateState(player1)
    updateState(player2)

    // detect for collision
    const hitP1 = rectangularCollision({
        rectangle1: player1,
        rectangle2: player2
    }) && player1.isAttacking && !player1.hasHit

    const hitP2 = rectangularCollision({
        rectangle1: player2,
        rectangle2: player1
    }) && player2.isAttacking && !player2.hasHit

    if (hitP1) {
        player1.hasHit = true
    }
    if (hitP2) {
        player2.hasHit = true
    }
    if (hitP1) {
        player2.takeHit()
        playSfx(sfx.hit)
        player2.health = clamp(player2.health, 0, 100)
    }
    if (hitP2) {
        player1.takeHit()
        playSfx(sfx.hit)
        player1.health = clamp(player1.health, 0, 100)
    }
    if (hitP1 || hitP2) {
        syncHealthUI()
        checkGameOver()
    }

    drawControlsLegend()
}

animate()

function normalizeKey(eventKey) {
    if (typeof eventKey !== 'string') return eventKey
    if (eventKey === '?') return '/'
    return eventKey.length === 1 ? eventKey.toLowerCase() : eventKey
}

window.addEventListener('keydown', (event) =>  {
    const key = normalizeKey(event.key)
    
    // Handle any key on title screen
    if (gameState === 'title') {
        // Try to play title music if not already playing
        if (titleBgm && titleBgm.paused) {
            playBgm(titleBgm)
        }
        startGame()
        return
    }
    
    if (gameState !== 'playing') return
    
    switch (key) {
        // player 1
        case 'd': 
            controlsLegendState.p1HasMoved = true
            player1.facing = 1
            keys.d.pressed = true;
            player1.lastKey = 'd'
            break;
        case 'a': 
            controlsLegendState.p1HasMoved = true
            player1.facing = -1
            keys.a.pressed = true;
            player1.lastKey = 'a'
            break;
        case 'w': // jump
            controlsLegendState.p1HasMoved = true
            if (!player1.isMovementLocked()) {
                player1.velocity.y = -20
            }
            if (!event.repeat) playSfx(sfx.jump)
            break;
        case 'f':
            if (!event.repeat) {
                player1.attack()
                playSfx(sfx.attack)
            }
            break

        // player 2
        case 'ArrowRight': 
            controlsLegendState.p2HasMoved = true
            player2.facing = 1
            keys.ArrowRight.pressed = true;
            player2.lastKey = 'ArrowRight'
            break;
        case 'ArrowLeft': 
            controlsLegendState.p2HasMoved = true
            player2.facing = -1
            keys.ArrowLeft.pressed = true;
            player2.lastKey = 'ArrowLeft'
            break;
        case 'ArrowUp': // jump
            controlsLegendState.p2HasMoved = true
            if (!player2.isMovementLocked()) {
                player2.velocity.y = -20
            }
            if (!event.repeat) playSfx(sfx.jump)
            break;
        case 'h':
            window.DEBUG_HITBOXES = !window.DEBUG_HITBOXES
            break
        case '/':
            if (!event.repeat) {
                player2.attack()
                playSfx(sfx.attack)
            }
            break
    }

})

window.addEventListener('keyup', (event) => {
    const key = normalizeKey(event.key)
    switch (key) {
        case 'd':
            keys.d.pressed = false;
            break;
        case 'a':
            keys.a.pressed = false;
            break;
    }
    // player2 keys
    switch (key) {
        case 'ArrowRight':
            keys.ArrowRight.pressed = false;
            break;
        case 'ArrowLeft':
            keys.ArrowLeft.pressed = false;
            break;
    }
})

// Auto-play title music when page loads
window.addEventListener('load', () => {
    // Try to play immediately
    playBgm(titleBgm)
})

// Also try to play on first user interaction
document.addEventListener('click', function playOnClick() {
    if (gameState === 'title' && titleBgm && titleBgm.paused) {
        playBgm(titleBgm)
    }
}, { once: true })

document.addEventListener('keydown', function playOnKeydown() {
    if (gameState === 'title' && titleBgm && titleBgm.paused) {
        playBgm(titleBgm)
    }
}, { once: true })