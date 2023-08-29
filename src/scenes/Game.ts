import Phaser from 'phaser';
import { CollisionCategory } from '../collision_category';
import { CharacterController } from '../module/controller';
import { POEModule } from '../module/poe_module';
export default class Demo extends Phaser.Scene {
  fish!: Phaser.GameObjects.Image;
  fishEatingBox!: MatterJS.BodyType;
  bounceLeft!: MatterJS.BodyType;
  bounceRight!: MatterJS.BodyType;
  display!: Phaser.GameObjects.Text;
  controller!: CharacterController;


  constructor() {
    super('GameScene');
  }
  texts = [
    '喔不!一只野生魯克魚龍誤食三色石搞丟了自己的顏色\n繼續餵食三色石幫助他找回原本的顏色吧!!',
    '沒錯，繼續下去!',
    '...',
    '他看起來像是三色石中毒了',
    '老天，我們做了什麼。。。',
  ]

  preload() {
    // this.load.image('orb', 'assets/CurrencyRerollSocketColours.webp');
    this.load.image('fish', 'assets/FlatFish.png');
    this.load.image('spot', 'assets/[CITYPNG.COM]Yellow Spot Light Spotlight Effect Transparent PNG - 2000x2000.png');
    this.load.audio('ding', 'assets/411749__natty23__bell-ding.wav');
    this.load.audio('book', 'assets/485502__mortaguado__colocando-libro-sobre-la-mesa-2.wav');

    CharacterController.preload(this);
    POEModule.preload(this);
  }


  create() {
    this.display = this.add.text(150, 500, this.texts[0],
      {
        fontSize: '20px',
        align: 'center',
        color: '#b9b079'
      },).setPadding(2);
    this.add.image(400, 50, 'spot').setScale(0.4, 0.6);

    this.fish = this.add.image(400, 400, 'fish').setScale(0.2);
    this.fishEatingBox = this.matter.add.rectangle(400, 400, 80, 30, { isStatic: true, isSensor: false });
    this.fishEatingBox.collisionFilter = {
      category: CollisionCategory.CATEGORY_PLATFORM,
      mask: CollisionCategory.CATEGORY_ORB,
      group: 0,
    };

    this.bounceLeft = this.matter.add.rectangle(325, 425, 150, 10, { isStatic: true, isSensor: false });
    this.bounceRight = this.matter.add.rectangle(475, 425, 150, 10, { isStatic: true, isSensor: false });
    this.bounceLeft.collisionFilter = {
      category: CollisionCategory.CATEGORY_PLATFORM,
      mask: CollisionCategory.CATEGORY_ORB,
      group: 0,
    };
    this.bounceRight.collisionFilter = {
      category: CollisionCategory.CATEGORY_PLATFORM,
      mask: CollisionCategory.CATEGORY_ORB,
      group: 0,
    };


    this.controller = new CharacterController(this, this.fish, this.fishEatingBox);
    this.controller.addModule(new POEModule());

    this.input.on('pointerdown', (pointer: any) => {
      this.controller.createOrb(pointer.x, pointer.y);
    });
    this.controller.on('newOrb', (event) => {
      let orb = event.orb.obj as unknown as (Phaser.Physics.Matter.Components.Collision & Phaser.Physics.Matter.Components.Force & Phaser.GameObjects.GameObject);
      orb.setCollidesWith(CollisionCategory.CATEGORY_PLATFORM);
      orb.setOnCollideWith(this.bounceRight, () => {
        this.matter.world.once('afterupdate', () => { orb.applyForce(new Phaser.Math.Vector2(0.01 + Phaser.Math.FloatBetween(0, 0.01), -0.015 + Phaser.Math.FloatBetween(-0.01, 0))) });
        this.sound.play('ding', { volume: 0.6, rate: 2 });
      });
      orb.setOnCollideWith(this.bounceLeft as MatterJS.BodyType, () => {
        this.matter.world.once('afterupdate', () => { orb.applyForce(new Phaser.Math.Vector2(-(0.01 + Phaser.Math.FloatBetween(0, 0.01)), -0.015 + Phaser.Math.FloatBetween(-0.01, 0))) });
        this.sound.play('ding', { volume: 0.6, rate: 2 });
      });
    });

    this.controller.on('counter', (event) => {
      if (event.counter >= 70) {
        this.display.text = this.texts[4];
        this.controller.setDeath();
      } else if (event.counter > 50) {
        this.display.text = this.texts[3];
      } else if (event.counter > 20) {
        this.display.text = this.texts[2];
      } else if (event.counter > 5) {
        this.display.text = this.texts[1];
      }
    });

  }
}




