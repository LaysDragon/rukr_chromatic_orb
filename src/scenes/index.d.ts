import PhaserMatterCollisionPlugin from "phaser-matter-collision-plugin";

declare module "phaser" {
    interface Scene {
        matterCollision: PhaserMatterCollisionPlugin;
    }
    namespace Scenes {
        interface Systems {
            matterCollision: PhaserMatterCollisionPlugin;
        }
    }
}
