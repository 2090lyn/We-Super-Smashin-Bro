const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d') // c = contex

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

const player1 = new Fighter ({
    position: {
        x: 150,
        y: 0
    },
    velocity: {
        x: 0,
        y: 0
    },
    offset: {
        x: 0,
        y: 0
    },
    attackBox: {
        offset: { x: 0, y: 0 },
        matchSprite: true
    },
    imgSrc: "./imgs/Cathlyn/CathlynRight.png",
    framesMax: 1,
    scale: 0.8,
    offset: {
        x: 200,
        y: 230
    }
})

const player2 = new Fighter ({
    position: {
        x: 1300,
        y: 100
    },
    velocity: {
        x: 0,
        y: 0
    },
    color: 'blue',
    offset: {
        x: 0,
        y: 0
    },
    attackBox: {
        offset: { x: 0, y: 0 },
        matchSprite: true
    },
    imgSrc: "./imgs/Noah/NoahLeft.png",
    framesMax: 1,
    scale: 0.8,
    offset: {
        x: 110,
        y: 220
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

const controlsLegendState = {
    p1HasMoved: false,
    p2HasMoved: false
}

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.attackBox.position.x + rectangle1.attackBox.width >= rectangle2.position.x && 
        rectangle1.attackBox.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.attackBox.position.y + rectangle1.attackBox.height >= rectangle2.position.y &&
        rectangle1.attackBox.position.y <= rectangle2.position.y + rectangle2.height
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

function animate() {
    window.requestAnimationFrame(animate)
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

    player1.velocity.x = 0; // stops player
    player2.velocity.x = 0;

    // player1 movementaa
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
            player1.velocity.y = -15
            break;
        case 'f':
            player1.attack()
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
            player2.velocity.y = -15
            break;
        case '/':
            player2.attack()
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
