var mapManager = {
    mapData: null,
    tLayer: null,
    xCount: 0,
    yCount: 0,
    tSize: {x: 64, y: 64},
    mapSize: {},
    tilesets: [],
    imgLoadCount: 0,
    imgLoaded: false,
    jsonLoaded: false,
    view: {x: 0, y: 0, w: 700, h: 700},
    parseMap: function (str) {
        this.mapData = JSON.parse(str);
        this.xCount = this.mapData.width;
        this.yCount = this.mapData.height;
        this.tSize = {x: this.mapData.tilewidth, y: this.mapData.tileheight};
        this.mapSize = {x: this.xCount * this.tSize.x, y: this.yCount * this.tSize.y};
        this.imgLoadCount = 0;
        this.imgLoaded = false;
        this.tLayer = this.mapData.layers.find(layer => layer.type === "tilelayer");
        this.tilesets.length = 0;

        for (let i = 0; i < this.mapData.tilesets.length; i++) {
            let img = new Image();
            img.onload = function () {
                mapManager.imgLoadCount++;

                if (mapManager.imgLoadCount === mapManager.tilesets.length)
                    mapManager.imgLoaded = true;
            };
            let t = this.mapData.tilesets[i];
            img.src = t.image;
            let ts = {
                firstgid: t.firstgid,
                image: img,
                name: t.name,
                xCount: Math.floor(t.imagewidth / mapManager.tSize.x),
                yCount: Math.floor(t.imageheight / mapManager.tSize.y)
            };
            this.tilesets.push(ts);
        }

        this.jsonLoaded = true;
    },
    draw: function (context) {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => this.draw(context), 100);
            return;
        }

        if (!this.tLayer) {
            for (let layer in this.mapData.layers)
                if (layer.type === "tilelayer") {
                    this.tLayer = layer;
                    break;
                }
        }

        for (let i = 0; i < this.tLayer.data.length; i++) {
            if (!this.tLayer.data[i])
                continue;

            let tile = this.getTile(this.tLayer.data[i]);
            let x = (i % this.xCount) * this.tSize.x;
            let y = Math.floor(i / this.xCount) * this.tSize.y;

            if (!this.isVisible(x, y, this.tSize.x, this.tSize.y))
                continue;

            x -= this.view.x;
            y -= this.view.y;
            context.drawImage(tile.img, tile.px, tile.py, this.tSize.x,
                this.tSize.y, x, y, this.tSize.x, this.tSize.y);
        }
    },
    getTile: function(tileIndex) {
        let tile = {
            img: null,
            px: 0,
            py: 0,
        };
        let tileset = this.getTileset(tileIndex);
        tile.img = tileset.image;
        let id = tileIndex - tileset.firstgid;
        let x = id % tileset.xCount;
        let y = Math.floor(id / tileset.xCount);
        tile.px = mapManager.tSize.x * x;
        tile.py = mapManager.tSize.y * y;
        return tile;
    },
    getTileset: function(tileIndex) {
        for (let index = this.tilesets.length - 1; index >= 0; index--)
            if (this.tilesets[index].firstgid <= tileIndex)
                return this.tilesets[index];

        return null;
    },
    isVisible: function(x, y, width, height) {
        return !(x + width < this.view.x || y + height < this.view.y || x > this.view.x + this.view.w || y > this.view.y + this.view.h);
    },
    parseEntities: function() {
        if (!this.imgLoaded || !this.jsonLoaded) {
            setTimeout(() => mapManager.parseEntities(), 100);
            return;
        }

        for (let j = 0; j < this.mapData.layers.length; j++) {
            if (this.mapData.layers[j].type === 'objectgroup') {
                let entities = this.mapData.layers[j];

                for (let i = 0; i < entities.objects.length; i++) {
                    let e = entities.objects[i];
                    try {
                        let obj = Object.create(gameManager.factory[e.type]);
                        obj.name = e.name;
                        obj.pos_x = e.x;
                        obj.pos_y = e.y;
                        obj.size_x = e.width;
                        obj.size_y = e.height;
                        obj.type = e.type;
                        if (e.properties)
                            for (let index = 0; index < e.properties.length; index++) {
                                let prop = e.properties[index];
                                obj[prop.name] = prop.value;
                            }

                        gameManager.entities.push(obj);
                        if (obj.name === "Player")
                            gameManager.initPlayer(obj);
                    } catch(e) {
                        console.error("Cannot decode objects");
                        console.error(e);
                    }
                }
            }
        }
    },
    getTilesetIdx: function(x, y) {
        let idx = Math.floor(y / this.tSize.y) * this.xCount + Math.floor(x / this.tSize.x);
        return this.tLayer.data[idx];
    },
    centerAt: function(x, y) {
        if (x < this.view.w / 2)
            this.view.x = 0;
        else if (x > this.mapSize.x - this.view.w / 2)
            this.view.x = this.mapSize.x - this.view.w;
        else
            this.view.x = x - this.view.w / 2;

        if (y < this.view.h / 2)
            this.view.y = 0;
        else if (y > this.mapSize.y - this.view.h / 2)
            this.view.y = this.mapSize.y - this.view.h;
        else
            this.view.y = y - this.view.h / 2;
    },
    loadMap: function (path, onLoad) {
        this.jsonLoaded = false;
        let request = new XMLHttpRequest();

        request.onreadystatechange = function () {
            if (request.readyState !== 4)
                return;

            if (request.status === 200) {
                mapManager.parseMap(request.responseText);
                if (onLoad)
                    onLoad();
            }
            else
                console.error(request);
        };

        request.open("GET", path, true);
        request.send();
    },
    hasWallsBetween(x1, y1, x2, y2) {
        let dx = Math.abs(x1-x2);
        let dy = Math.abs(y1-y2);
        let steps = Math.ceil(Math.max(dx / this.tSize.x,dy / this.tSize.x) * 2);
        let stepX = (x2-x1) / steps;
        let stepY = (y2-y1) / steps;
        while (x1 !== x2 && y1 !== y2) {
            if (this.getTilesetIdx(x1, y1) > 0)
                return true;

            if (Math.abs(x1-x2) < Math.abs(stepX))
                x1 = x2;
            else
                x1 += stepX;

            if (Math.abs(y1-y2) < Math.abs(stepY))
                y1 = y2;
            else
                y1 += stepY;
        }
        return false;
    }
};

