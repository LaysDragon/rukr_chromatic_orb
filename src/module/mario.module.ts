import { GameObjects, Scene, Math } from "phaser";
import { Effect, Module, OptionalRecord, OrbEntry, OrbItem, SoundType } from "./controller";

export class MarioModule extends Module {
    orbs: OrbEntry[] = [
        InvincibleStar.entry,
    ];

    static preload(scene: Scene): void {
        InvincibleStar.entry.preload(scene);
        Invincible.preload(scene);
        scene.load.audio('eating_powerup', 'assets/mario/Mushroom Sound Effect.m4a');
    }
}


export class InvincibleStar extends OrbItem<Phaser.Physics.Matter.Image> {

    static entry: OrbEntry = new OrbEntry(
        (module) => module.controller.death ? 0.01 : 0.001,
        (x, y, module) => new InvincibleStar(x, y, module),
        (scene) => {
            scene.load.image('mario_star', 'assets/mario/mario_star.png');
        },
    );

    colorEffect!: Phaser.FX.ColorMatrix;
    override soundMatrix: OptionalRecord<SoundType, Record<string, () => void>> = {
        consumed: {
            '*': () => this.scene.sound.play('eating_powerup', {
                start: 0.1,
                name: 'blablabla',
                config: {
                    volume: 0.1
                }
            }),
        }
    };

    createObj(x: number, y: number): Phaser.Physics.Matter.Image {
        return this.scene.matter.add.image(x, y, 'mario_star')
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

    applyAction(): void {
        this.controller.addEffect(new Invincible(this.module));
        this.destroy();
    }
}

export class Invincible extends Effect {
    static preload(scene: Scene): void {
        scene.load.audio('mario_invincible', 'assets/mario/star_power.m4a')
    }

    timer: number = 10000;

    tint = 0;
    apply(): void {
        this.scene.sound.play('mario_invincible', { name: 'what', config: { loop: true } });
        (this.controller.character as GameObjects.Image).tint;
        this.tint = (this.controller.character as unknown as GameObjects.Components.Tint).tintTopLeft;
        (this.controller.character as unknown as GameObjects.Components.Tint).clearTint();
    }
    reapply(effect: this): void { }
    inactive(): void {
        this.scene.sound.stopByKey('mario_invincible');
        this.controller.colorEffect.contrast(0);
        this.controller.colorEffect.hue(this.hue, true);
        (this.controller.character as unknown as GameObjects.Components.Tint).setTint(this.tint);
    }

    hueTimer = 0;
    hue = Math.Between(50, 300);
    update(time: number, delta: number): void {

        if (time % 120 > 60) {
            this.controller.colorEffect.contrast(0.5);
        } else {
            this.controller.colorEffect.contrast(0);
        }

        this.controller.colorEffect.hue(this.hue, true);
        this.hueTimer += delta;
        if (this.hueTimer > 60) {
            this.hue = (this.hue + 90) % 360;
            this.hueTimer = 0;
        }

    }

}