class Sprite {
    constructor({
        position,
        imageSrc,
        imgSrc,
        scale = 1,
        framesMax = 1,
        offset = { x: 0, y: 0 }
    }) {
    this.position = position
    this.width = 50
    this.height = 150
    this.image = new Image()
    this.image.src = imageSrc ?? imgSrc ?? ''
    this.scale = scale
    this.framesMax = Math.max(1, framesMax)
    this.framesCurrent = 0
    this.framesElapsed = 0
    this.framesHold = 5
    this.offset = offset
    }

    draw() {
        if (!this.image.complete || this.image.naturalWidth === 0) return

        const frameWidth = this.image.width / this.framesMax
        c.drawImage(
        this.image,
        this.framesCurrent * frameWidth,
        0,
        frameWidth,
        this.image.height,
        this.position.x - this.offset.x,
        this.position.y - this.offset.y,
        frameWidth * this.scale,
        this.image.height * this.scale
        )
    }

    animateFrames() {
        this.framesElapsed++

        if (this.framesElapsed % this.framesHold === 0) {
        if (this.framesCurrent < this.framesMax - 1) {
            this.framesCurrent++
        } else {
            this.framesCurrent = 0
        }
        }
    }

    update() {
        this.draw()
        this.animateFrames()
    }
    }

    class Fighter extends Sprite {
    constructor({
        position,
        velocity,
        color = 'red',
        imageSrc,
        imgSrc,
        scale = 1,
        framesMax = 1,
        offset = { x: 0, y: 0 },
        sprites,
        attackBox = { offset: { x: 0, y: 0 }, width: 100, height: 50 }
    }) {
        super({
            position,
            imageSrc,
            imgSrc,
            scale,
            framesMax,
            offset
        })

        this.velocity = velocity
        this.width = 50
        this.height = 150
        this.lastKey
        const attackOffset = attackBox.offset ?? { x: 0, y: 0 }
        this.attackBox = {
        position: {
            x: this.position.x,
            y: this.position.y
        },
        offset: attackOffset,
        width: attackBox.width ?? 100,
        height: attackBox.height ?? 50
        }
        this.color = color
        this.isAttacking
        this.attackTimeout
        this.health = 100
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        this.sprites = sprites
        this.dead = false

        if (this.sprites) {
        for (const sprite in this.sprites) {
            this.sprites[sprite].image = new Image()
            this.sprites[sprite].image.src = this.sprites[sprite].imageSrc
        }
        }
    }

    draw() {
        if (this.image && this.image.complete && this.image.naturalWidth !== 0) {
        super.draw()
        } else {
        c.fillStyle = this.color
        c.fillRect(this.position.x, this.position.y, this.width, this.height)
        }

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
        if (!this.dead) this.animateFrames()

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        const bounds = stage?.bounds
        const groundOffset = 30
        const groundY = (bounds ? bounds.y + bounds.height : stage.height) + groundOffset
        if (this.position.y + this.height + this.velocity.y >= groundY) {
        this.velocity.y = 0
        this.position.y = groundY - this.height
        } else {
        this.velocity.y += gravity
        }

        if (bounds) {
        const minX = bounds.x
        const maxX = bounds.x + bounds.width - this.width
        this.position.x = Math.max(minX, Math.min(this.position.x, maxX))
        }

        this.attackBox.position.x = this.position.x + this.attackBox.offset.x
        this.attackBox.position.y = this.position.y + this.attackBox.offset.y
    }

    attack() {
        if (this.sprites) this.switchSprite('attack1')
            this.isAttacking = true
        if (this.attackTimeout) clearTimeout(this.attackTimeout)
        this.attackTimeout = setTimeout(() => {
            this.isAttacking = false
        }, 100)
    }

    takeHit() {
        this.health -= 20

        if (!this.sprites) return
        if (this.health <= 0) {
        this.switchSprite('death')
        } else {
        this.switchSprite('takeHit')
        }
    }

    switchSprite(sprite) {
        if (!this.sprites) return

        if (this.image === this.sprites.death?.image) {
        if (this.framesCurrent === this.sprites.death.framesMax - 1)
            this.dead = true
        return
        }

        if (
        this.image === this.sprites.attack1?.image &&
        this.framesCurrent < this.sprites.attack1.framesMax - 1
        )
        return

        if (
        this.image === this.sprites.takeHit?.image &&
        this.framesCurrent < this.sprites.takeHit.framesMax - 1
        )
        return

        switch (sprite) {
        case 'idle':
            if (this.image !== this.sprites.idle?.image) {
            this.image = this.sprites.idle.image
            this.framesMax = this.sprites.idle.framesMax
            this.framesCurrent = 0
            }
            break
        case 'run':
            if (this.image !== this.sprites.run?.image) {
            this.image = this.sprites.run.image
            this.framesMax = this.sprites.run.framesMax
            this.framesCurrent = 0
            }
            break
        case 'jump':
            if (this.image !== this.sprites.jump?.image) {
            this.image = this.sprites.jump.image
            this.framesMax = this.sprites.jump.framesMax
            this.framesCurrent = 0
            }
            break
        case 'fall':
            if (this.image !== this.sprites.fall?.image) {
            this.image = this.sprites.fall.image
            this.framesMax = this.sprites.fall.framesMax
            this.framesCurrent = 0
            }
            break
        case 'attack1':
            if (this.image !== this.sprites.attack1?.image) {
            this.image = this.sprites.attack1.image
            this.framesMax = this.sprites.attack1.framesMax
            this.framesCurrent = 0
            }
            break
        case 'takeHit':
            if (this.image !== this.sprites.takeHit?.image) {
            this.image = this.sprites.takeHit.image
            this.framesMax = this.sprites.takeHit.framesMax
            this.framesCurrent = 0
            }
            break
        case 'death':
            if (this.image !== this.sprites.death?.image) {
            this.image = this.sprites.death.image
            this.framesMax = this.sprites.death.framesMax
            this.framesCurrent = 0
            }
            break
        }
    }
}
