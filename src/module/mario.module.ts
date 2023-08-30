import { GameObjects, Scene } from "phaser";
import { Effect, Module, OrbEntry, OrbItem } from "./controller";

export class MarioModule extends Module {
    orbs: OrbEntry[] = [
        InvincibleStar.entry,
    ];

    static preload(scene: Scene): void {
        InvincibleStar.entry.preload(scene);
    }
}


class InvincibleStar extends OrbItem<Phaser.Physics.Matter.Image> {
    static entry: OrbEntry = new OrbEntry(
        1,
        (x, y, module) => new InvincibleStar(x, y, module),
        (scene) => {
            scene.load.image('mario_star', 'assets/mario/mario_star.png');
        },
    );

    colorEffect!: Phaser.FX.ColorMatrix;


    createObj(x: number, y: number): Phaser.Physics.Matter.Image {
        return this.module.scene.matter.add.image(x, y, 'mario_star')
            .setScale(0.15);
    }

    configObj(): void {
        super.configObj();
        this.colorEffect = this.obj.postFX.addColorMatrix();
        this.obj.setAngularVelocity(0);
        (this.obj.body as MatterJS.BodyType).inertia = Infinity;
        (this.obj.body as MatterJS.BodyType).inverseInertia = 0;
    }


    update(time: number, delta: number): void {
        if (time % 150 < 50) {
            this.obj.setTint(0xFF0000);
            this.colorEffect.contrast(0);
        } else if (time % 150 < 100) {
            this.obj.clearTint();
            this.colorEffect.contrast(5);
        } else {
            this.colorEffect.contrast(0);
            this.obj.clearTint();
        }
    }

    bounceSound(): void {
        this.module.scene.sound.play('ding', { volume: 0.6, rate: 2 });
    }

    applyAction(): void {

    }
}

class Invincible extends Effect {
    apply(): void { }
    update(time: number, delta: number): void {

    }

}