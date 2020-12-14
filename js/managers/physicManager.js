var physicManager = {
    update: function(obj) {
        if (obj.move_x === 0 && obj.move_y === 0)
            return 'stop';

        let newX = obj.pos_x + Math.floor(obj.move_x * obj.speed);
        let newY = obj.pos_y + Math.floor(obj.move_y * obj.speed);
        let ts = mapManager.getTilesetIdx(newX, newY)
            || mapManager.getTilesetIdx(newX + obj.size_x, newY)
            || mapManager.getTilesetIdx(newX + obj.size_x, newY + obj.size_y)
            || mapManager.getTilesetIdx(newX, newY + obj.size_y);
        let e = this.entityAtXY(obj, newX, newY);

        if (e && obj.ignoreEntity && obj.ignoreEntity(e))
            e = null;

        if (e && obj.onTouchEntity)
            obj.onTouchEntity(e);

        if (ts !== 0 && obj.onTouchMap)
            obj.onTouchMap();

        if (ts === 0 && !e) {
            obj.pos_x = newX;
            obj.pos_y = newY;
        } else {
            return 'break';
        }
        return 'move';
    },
    entityAtXY: function(obj, x, y) {
        return gameManager.entities.find(e =>
            e.name !== obj.name
            && !(x + obj.size_x < e.pos_x || y + obj.size_y < e.pos_y || x > e.pos_x + e.size_x || y > e.pos_y + e.size_y)
        )
    }
};