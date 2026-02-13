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
        this.mirror = false

        this.image.onload = () => {
            this.recalcDimensions()
        }
    }

    recalcDimensions() {
        if (!this.image || !this.image.naturalWidth) return
        const frameWidth = this.image.width / this.framesMax
        this.width = frameWidth * this.scale
        this.height = this.image.height * this.scale
    }

    draw() {
        if (!this.image.complete || this.image.naturalWidth === 0) return

        const frameWidth = this.image.width / this.framesMax
        const drawWidth = frameWidth * this.scale
        const drawHeight = this.image.height * this.scale
        const dx = this.position.x - this.offset.x
        const dy = this.position.y - this.offset.y

        c.save()
        if (this.mirror) {
            c.translate(dx + drawWidth, dy)
            c.scale(-1, 1)
            c.drawImage(
                this.image,
                this.framesCurrent * frameWidth,
                0,
                frameWidth,
                this.image.height,
                0,
                0,
                drawWidth,
                drawHeight
            )
        } else {
            c.drawImage(
                this.image,
                this.framesCurrent * frameWidth,
                0,
                frameWidth,
                this.image.height,
                dx,
                dy,
                drawWidth,
                drawHeight
            )
        }
        c.restore()
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
        attackBox = { offset: { x: 0, y: 0 }, width: 100, height: 50 },
        hitbox = { offset: { x: 0, y: 0 }, width: undefined, height: undefined },
        facing = 1,
        attackDuration = 220,
        attackCooldown = 350,
        hitDuration = 180
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
        const baseAttackOffset = attackBox.offset ?? { x: 0, y: 0 }
        const attackOffsetLeft = attackBox.offsetLeft ?? attackBox.offset?.left ?? baseAttackOffset
        const attackOffsetRight = attackBox.offsetRight ?? attackBox.offset?.right ?? baseAttackOffset
        this.attackBoxOffsets = { left: attackOffsetLeft, right: attackOffsetRight }
        const initialAttackOffset = this.facing === -1 ? attackOffsetLeft : attackOffsetRight
        this.attackBox = {
            position: {
                x: this.position.x,
                y: this.position.y
            },
            offset: initialAttackOffset,
            width: attackBox.width ?? 100,
            height: attackBox.height ?? 50
        }
        const hitboxOffset = hitbox.offset ?? { x: 0, y: 0 }
        this.hitbox = {
            position: {
                x: this.position.x + hitboxOffset.x,
                y: this.position.y + hitboxOffset.y
            },
            offset: hitboxOffset,
            width: hitbox.width,
            height: hitbox.height
        }
        this.hitboxCustom = {
            width: hitbox.width,
            height: hitbox.height
        }
        this.color = color
        this.isAttacking
        this.attackTimeout
        this.attackDuration = attackDuration
        this.attackCooldown = attackCooldown
        this.lastAttackTime = 0
        this.attackLockUntil = 0
        this.hasHit = false
        this.hitDuration = hitDuration
        this.hitTimeout
        this.health = 100
        this.framesCurrent = 0
        this.framesElapsed = 0
        this.framesHold = 5
        this.sprites = sprites
        this.dead = false
        this.facing = facing >= 0 ? 1 : -1
        this.mirror = false
        this.currentState = 'idle'
        this.onGround = false

        if (this.sprites) {
            for (const sprite in this.sprites) {
                const img = new Image()
                img.onload = () => {
                    if (this.image === img) this.recalcDimensions()
                }
                const src = this.sprites[sprite].imageSrc ?? this.sprites[sprite].imgSrc ?? ''
                img.src = src
                this.sprites[sprite].image = img
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

        const debugHitboxes = typeof window !== 'undefined' && window.DEBUG_HITBOXES
        if (!debugHitboxes) {
            c.save()
            c.globalAlpha = 0.7
            c.strokeStyle = 'lime'
            c.lineWidth = 2
            c.strokeRect(
                this.position.x - this.offset.x,
                this.position.y - this.offset.y,
                this.width,
                this.height
            )
            c.strokeStyle = 'red'
            c.strokeRect(
                this.hitbox.position.x,
                this.hitbox.position.y,
                this.hitbox.width ?? this.width,
                this.hitbox.height ?? this.height
            )
            c.strokeStyle = 'yellow'
            c.strokeRect(
                this.attackBox.position.x,
                this.attackBox.position.y,
                this.attackBox.width,
                this.attackBox.height
            )
            c.restore()
        }
    }

    update() {
        this.draw()
        const isMoving = Math.abs(this.velocity.x) > 0.01 || Math.abs(this.velocity.y) > 0.01
        if (!this.dead && (isMoving || this.isAttacking)) this.animateFrames()

        this.position.x += this.velocity.x
        this.position.y += this.velocity.y

        const bounds = stage?.worldBounds ?? stage?.bounds
        const groundOffset = 0
        const groundY = (bounds ? bounds.height : stage.height) + groundOffset
        if (this.position.y + this.height + this.velocity.y >= groundY) {
            this.velocity.y = 0
            this.position.y = groundY - this.height
            this.onGround = true
        } else {
            this.velocity.y += gravity
            this.onGround = false
        }

        if (bounds) {
            const minX = bounds.x + this.offset.x - 100
            const maxX = bounds.x + bounds.width - this.width + this.offset.x + 100
            this.position.x = Math.max(minX, Math.min(this.position.x, maxX))
        }

        const hbWidth = this.hitboxCustom.width ?? this.width
        const hbHeight = this.hitboxCustom.height ?? this.height
        this.hitbox.position.x = this.position.x + this.hitbox.offset.x
        this.hitbox.position.y = this.position.y + this.hitbox.offset.y
        this.hitbox.width = hbWidth
        this.hitbox.height = hbHeight

        const attackOffset = this.facing === -1 ? this.attackBoxOffsets.left : this.attackBoxOffsets.right
        this.attackBox.offset = attackOffset
        const frontOffset = attackOffset.x ?? 0
        const verticalOffset = attackOffset.y ?? 0
        const attackX = this.facing === 1
            ? this.position.x + hbWidth + frontOffset
            : this.position.x - this.attackBox.width - frontOffset
        const attackY = this.position.y + (hbHeight * 0.55) + verticalOffset - this.attackBox.height / 2
        this.attackBox.position.x = attackX
        this.attackBox.position.y = attackY
    }

    attack() {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
        if (now - this.lastAttackTime < this.attackCooldown) return
        if (this.dead) return
        this.lastAttackTime = now
        this.attackLockUntil = now + this.attackDuration
        this.hasHit = false
        if (this.sprites) this.switchSprite('attack1')
        this.isAttacking = true
        if (this.attackTimeout) clearTimeout(this.attackTimeout)
        this.attackTimeout = setTimeout(() => {
            this.isAttacking = false
            this.currentState = 'idle'
            if (this.sprites) this.switchSprite('idle')
        }, this.attackDuration)
    }

    isMovementLocked() {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now())
        return now < this.attackLockUntil
    }

    takeHit() {
        this.health -= 5

        if (!this.sprites) return
        if (this.health <= 0) {
            this.currentState = 'death'
            this.switchSprite('death')
        } else {
            this.currentState = 'takeHit'
            this.switchSprite('takeHit')
            if (this.hitTimeout) clearTimeout(this.hitTimeout)
            this.hitTimeout = setTimeout(() => {
                if (this.dead) return
                this.currentState = 'idle'
                if (!this.isAttacking) this.switchSprite('idle')
            }, this.hitDuration)
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

        const resolved = this.resolveSprite(sprite)
        if (!resolved) return

        const offsetChanged = resolved.offset &&
            (resolved.offset.x !== this.offset.x || resolved.offset.y !== this.offset.y)

        const scaleChanged = resolved.scale !== undefined && resolved.scale !== this.scale

        if (
            this.image !== resolved.image ||
            this.framesMax !== resolved.framesMax ||
            this.mirror !== resolved.mirror ||
            offsetChanged ||
            scaleChanged
        ) {
            this.image = resolved.image
            this.framesMax = resolved.framesMax
            this.framesHold = resolved.framesHold ?? this.framesHold
            this.framesCurrent = 0
            this.mirror = !!resolved.mirror
            if (resolved.scale !== undefined) {
                this.scale = resolved.scale
            }
            if (resolved.offset) {
                this.offset = {
                    x: resolved.offset.x ?? this.offset.x,
                    y: resolved.offset.y ?? this.offset.y
                }
            }
            this.recalcDimensions()
        }
    }

    resolveSprite(name) {
        if (!this.sprites) return null
        const dir = this.facing === -1 ? 'Left' : 'Right'

        const candidates = [
            `${name}${dir}`,
            `${name}_${dir.toLowerCase()}`,
            `${name}${dir.toLowerCase()}`,
            name
        ]

        const selectedKey = candidates.find(key => this.sprites[key])
        if (!selectedKey) return null

        const sprite = this.sprites[selectedKey]

        return {
            image: sprite.image,
            framesMax: sprite.framesMax ?? sprite.frames ?? 1,
            framesHold: sprite.framesHold,
            mirror: false,
            offset: sprite.offset,
            scale: sprite.scale
        }
    }
}