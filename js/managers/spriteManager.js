var spriteManager = {
    image: new Image(),
    sprites: [],
    imgLoaded: false,
    jsonLoaded: false,
    loadAtlas: function (jsonUrl, imgUrl, onLoad) {
        this.imgLoaded = false;
        this.jsonLoaded = false;
        let request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (request.readyState === 4 && request.status === 200) {
                spriteManager.parseAtlas(request.responseText);
                if (onLoad)
                    onLoad();
            }
        };
        request.open("GET", jsonUrl, true);
        request.send();
        this.loadImg(imgUrl);
    },
    loadImg: function(imgUrl) {
        this.image.onload = function() {
            spriteManager.imgLoaded = true;
        };
        this.image.src = imgUrl;
    },
    parseAtlas: function(raw) {
        let atlas = JSON.parse(raw);
        this.sprites.length = 0;
        for (let index = 0; index < atlas.length; index++) {
            let frame = atlas[index];
            this.sprites.push({name: frame.name, x: frame.x, y: frame.y, w: frame.width, h: frame.height});
        }
        this.jsonLoaded = true;
    },
    drawSprite: function(ctx, name, x, y, rotation = 0, width = null, height = null) {
        if (!this.imgLoaded || !this.jsonLoaded)
            return setTimeout(() => spriteManager.drawSprite(ctx, name, x, y), 100);

        let sprite = this.getSprite(name);

        if (!sprite) {
            console.error(`Sprite ${name} was not found`);
            return;
        }

        if (!width)
            width = sprite.w;
        if (!height)
            height = sprite.h;

        if (!mapManager.isVisible(x, y, sprite.w, sprite.h))
            return;

        x -= mapManager.view.x;
        y -= mapManager.view.y;
        rotation = rotation * Math.PI / 180;
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation);
        ctx.drawImage(
            this.image, sprite.x, sprite.y, sprite.w, sprite.h,
            -width/2, -height/2, //coords
            width, height // craw size
        );
        ctx.restore();
    },
    getSprite: function(name) {
        return this.sprites.find(sprite => sprite.name === name);
    }
};