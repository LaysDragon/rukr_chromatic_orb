import { Module, OrbEntry, CharacterController, OrbItem, Effect } from "./controller";
import * as Phaser from 'phaser';

export class POEModule extends Module {
  orbs: OrbEntry[] = [
    ColorOrb.entry,
  ];

  static preload(scene: Phaser.Scene) {
    ColorOrb.entry.preload(scene);
    scene.load.image('poe_death', 'assets/poe/death.png');
  }

  init(controller: CharacterController, scene: Phaser.Scene): void {
    super.init(controller, scene);
    this.controller.on('death', () => {
      this.scene.add.image(400, 300, 'poe_death').setScale(0.7);
    });
  }
}

class ColorOrb extends OrbItem<Phaser.Physics.Matter.Image> {

  static entry = new OrbEntry(
    1,
    (x, y, module) => new ColorOrb(x, y, module),
    (scene) => scene.load.image('poe_color_orb', 'assets/poe/CurrencyRerollSocketColours.webp'),
  );

  createObj(x: number, y: number): Phaser.Physics.Matter.Image {
    return this.module.scene.matter.add.image(x, y, 'poe_color_orb')
      .setScale(0.4)
      .setAngle(Phaser.Math.Between(0, 360));
  }


  update(time: number, delta: number): void {

  }

  bounceSound(): void {
    this.module.scene.sound.play('ding', { volume: 0.6, rate: 2 });
  }

  applyAction(): void {
    if (this.module.controller.counter >= 70) {
      if (this.module.controller.counter == 70) {
        this.module.controller.hurt();
      }
    } else if (this.module.controller.counter > 50) {
      this.module.controller.hurt();
    }
    this.module.controller.addEffect(new ChangeColorEffect(this.module));
  }
}

class ChangeColorEffect extends Effect {
  readonly colors = [
    0xff0000,
    0xffff00,
    0x00ff00,
    0x00ffff,
    0x0000ff,
    0xff00ff,
  ];

  skipRepeat = false;

  apply(): void {
    if (this.module.controller.counter > 50) {
      (this.module.controller.character as unknown as Phaser.GameObjects.Components.Tint).setTint(this.colors[Math.floor(Math.random() * this.colors.length)]);
    }

    this.module.controller.colorEffect.hue((0.05 + Math.random() * 0.9) * 360)
  }
  reapply(effect: this): void { }
  inactive(): void { }
  update(): void { }

}