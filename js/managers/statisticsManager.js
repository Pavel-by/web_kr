var statisticsManager = {
    kills: 0,
    levels: [
        "/map.json",
        "/map1.json"
    ],
    curLevel: 0,
    availableLevel: 0,
    finished: false,
    lifetime: 0,
    damage: 0,

    finish(success) {
        if (success) {
            this.finished = 'win';
            this.availableLevel = Math.min(Math.max(this.availableLevel, this.curLevel + 1), this.levels.length-1);
        } else
            this.finished = 'fail';

        gameManager.stop();
        this.redraw();
    },
    incKills() {
        this.kills++;
        this.redraw();
    },
    checkoutPlayer(player) {
        if (!player)
            return;

        this.lifetime = player.lifetime;
        this.damage = player.rocketDamage;

        let enemies = 0;
        for (let i = 0; i < gameManager.entities.length; i++) {
            let entity = gameManager.entities[i];
            if (entity.type === 'EnemyTank')
                enemies++;
        }

        if (!enemies)
            this.finish(true);

        this.redraw();
    },
    restartLevel() {
        this.kills = 0;
        this.finished = false;
        gameManager.loadAll(ctx);
        gameManager.play(ctx);
    },
    nextLevel() {
        statisticsManager.curLevel = Math.min(this.curLevel+1, this.availableLevel);
        statisticsManager.restartLevel();
    },
    prevLevel() {
        statisticsManager.curLevel = Math.max(this.curLevel-1, 0);
        statisticsManager.restartLevel();
    },
    redraw() {
        document.getElementById('level').innerHTML = `${statisticsManager.curLevel+1}`;
        document.getElementById('lifetime').innerHTML = `${statisticsManager.lifetime}`;
        document.getElementById('damage').innerHTML = `${statisticsManager.damage}`;
        document.getElementById('kills').innerHTML = `${statisticsManager.kills}`;
        let winMessage = document.getElementById('win-message');
        let failMessage = document.getElementById('fail-message');
        let prevLevelButton = document.getElementById('prev-level-button');
        let nextLevelButton = document.getElementById('next-level-button');

        if (this.finished === false) {
            winMessage.style.display = 'none';
            failMessage.style.display = 'none';
        } else if (this.finished === 'win') {
            winMessage.style.display = 'block';
            failMessage.style.display = 'none';
        } else {
            winMessage.style.display = 'none';
            failMessage.style.display = 'block';
        }

        prevLevelButton.disabled = !(this.curLevel > 0);
        nextLevelButton.disabled = !(this.curLevel < this.availableLevel);
    }
};