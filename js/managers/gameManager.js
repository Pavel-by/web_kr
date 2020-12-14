var gameManager = {
    factory: {},
    entities: [],
    fireNum: 0,
    player: null,
    laterKill: [],
    drawInterval: 20,
    intervalId: null,
    initPlayer: function(obj) {
        this.player = obj;
    },
    kill: function(obj) {
        this.laterKill.push(obj);
    },
    update: function(ctx) {
        if (!this.player)
            return;

        if (eventsManager.action['fire'])
            this.player.fire();

        this.entities.forEach(e => {
            try {
                if (e.update)
                    e.update()
            }  catch (exception) {
                console.error(exception);
            }
        });
        statisticsManager.checkoutPlayer(this.player);

        for (let i = 0; i < this.laterKill.length; i++) {
            let idx = this.entities.indexOf(this.laterKill[i]);
            if (idx > -1)
                this.entities.splice(idx, 1);
        }
        this.laterKill.length = 0;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        mapManager.draw(ctx);
        mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.draw(ctx);
    },
    draw: function(ctx) {
        for (let index = 0; index < this.entities.length; index++)
            this.entities[index].draw(ctx);
    },
    loadAll: function(ctx) {
        this.laterKill.length = 0;
        this.entities.length = 0;
        this.player = null;
        this.fireNum = 0;
        mapManager.loadMap(statisticsManager.levels[statisticsManager.curLevel]);
        spriteManager.loadAtlas("/tiles/objects.json", "/tiles/objects.png");
        this.factory['Player'] = Player;
        this.factory['EnemyTank'] = Tank;
        this.factory['BonusOil'] = BonusOil;
        this.factory['BonusRocket'] = BonusRocket;
        this.factory['Rocket'] = Rocket;
        mapManager.parseEntities();
        mapManager.draw(ctx);
        eventsManager.setup(ctx.canvas);
    },
    play: function(ctx) {
        gameManager.stop();
        gameManager.intervalId = setInterval(() => updateWorld(ctx), gameManager.drawInterval);
    },
    stop() {
        if (gameManager.intervalId) {
            clearInterval(gameManager.intervalId);
            gameManager.intervalId = null;
        }
    }
};

function updateWorld(ctx) {
    gameManager.update(ctx);
}