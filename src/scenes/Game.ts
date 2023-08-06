import Phaser from 'phaser';
import HslAdjustPostFxPipeline from 'phaser3-rex-plugins/plugins/hsladjustpipeline';
import HslAdjustPipelinePlugin from 'phaser3-rex-plugins/plugins/hsladjustpipeline-plugin';

export default class Demo extends Phaser.Scene {
  fish!: Phaser.GameObjects.Image;
  orbTween?: Phaser.Tweens.Tween;
  fishEatingBox!: MatterJS.BodyType;
  bounceLeft!: MatterJS.BodyType;
  bounceRight!: MatterJS.BodyType;
  fishPipelineInstance!: HslAdjustPostFxPipeline;

  counter = 0;
  display!: Phaser.GameObjects.Text;



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
    this.load.image('orb', 'assets/CurrencyRerollSocketColours.webp');
    this.load.image('fish', 'assets/FlatFish.png');
    this.load.image('spot', 'assets/[CITYPNG.COM]Yellow Spot Light Spotlight Effect Transparent PNG - 2000x2000.png');
    this.load.image('death', 'assets/death.png');

    this.load.audio('pop', 'assets/376968__elmasmalo1__bubble-pop.wav');
    this.load.audio('ding', 'assets/411749__natty23__bell-ding.wav');
    this.load.audio('hurt', 'assets/y2mate.com - Minecraft hit sound  1080p60fps.mp3');
    this.load.audio('book', 'assets/485502__mortaguado__colocando-libro-sobre-la-mesa-2.wav');
  }

  colors = [
    0xff0000,
    0xffff00,
    0x00ff00,
    0x00ffff,
    0x0000ff,
    0xff00ff,
  ];

  readonly CATEGORY_PLATFORM = 0b00001;
  readonly CATEGORY_ORB = 0b00010;

  hurt() {
    this.sound.play('hurt', {
      start: 0.78,
      name: 'what_ever_is_this_i_dont_care',
      config: {
        volume: 0.8
      }
    });
    this.cameras.main.shake(200, 0.005);
  }

  createOrb(x: number, y: number) {
    const orb = this.matter.add.image(x + Phaser.Math.Between(-60, 60), y + Phaser.Math.Between(-20, 20), 'orb')
      .setScale(0.4)
      .setAngle(Phaser.Math.Between(0, 360));
    orb.setCollisionCategory(this.CATEGORY_ORB);
    orb.setCollidesWith(this.CATEGORY_PLATFORM);
    orb.setBounce(0.5);
    orb.setAngularVelocity(Phaser.Math.FloatBetween(-0.2, 0.2));
    this.sound.play('book', {
      start: 0.45,

      name: 'what_ever_is_this_i_dont_care',
      config: {
        volume: 0.7,
        rate: 0.3,
      }
    });


    this.fishEatingBox.setOnCollideWith(orb.body as MatterJS.BodyType, () => {
      this.counter++;


      if (this.counter >= 70) {
        this.display.text = this.texts[4];
        this.add.image(400, 300, 'death').setScale(0.7);
        if (this.counter == 70) {
          this.hurt();
        }
      } else if (this.counter > 50) {
        this.hurt();
        this.display.text = this.texts[3];
      } else if (this.counter > 20) {
        this.display.text = this.texts[2];
      } else if (this.counter > 5) {
        this.display.text = this.texts[1];
      }
      if (this.counter > 70) {
        let forceX = 0.01 + Phaser.Math.FloatBetween(0, 0.01);
        if (Math.random() > 0.5) {
          forceX = -forceX;
        }
        this.matter.world.once('afterupdate', () => { orb.applyForce(new Phaser.Math.Vector2(forceX, -0.01)) });
      } else {
        orb.destroy();

        if (this.counter > 50) {
          this.fish.setTint(this.colors[Math.floor(Math.random() * this.colors.length)]);
        }
        this.fishPipelineInstance.hueRotate = 0.05 + Math.random() * 0.9;
      }



      this.orbTween?.remove();
      this.orbTween = this.tweens.add({
        targets: this.fish,
        scaleX: 0.22,
        scaleY: 0.18,
        duration: 50,
        ease: 'Sine.inOut',
        yoyo: true,
      });
      this.fish.setScale(0.2, 0.2);

      this.sound.play('pop',{volume:0.2});
    });

    orb.setOnCollideWith(this.bounceRight, () => {
      this.matter.world.once('afterupdate', () => { orb.applyForce(new Phaser.Math.Vector2(0.01 + Phaser.Math.FloatBetween(0, 0.01), -0.015 + Phaser.Math.FloatBetween(-0.01, 0))) });
      this.sound.play('ding', { volume: 0.6, rate: 2 });
    });
    orb.setOnCollideWith(this.bounceLeft as MatterJS.BodyType, () => {
      this.matter.world.once('afterupdate', () => { orb.applyForce(new Phaser.Math.Vector2(-(0.01 + Phaser.Math.FloatBetween(0, 0.01)), -0.015 + Phaser.Math.FloatBetween(-0.01, 0))) });
      this.sound.play('ding', { volume: 0.6, rate: 2 });
    });

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
      category: this.CATEGORY_PLATFORM,
      mask: this.CATEGORY_ORB,
      group: 0,
    };


    this.fishPipelineInstance = (this.plugins.get('rexHSLAdjustPipeline') as HslAdjustPipelinePlugin).add(this.fish, {});
    this.fishPipelineInstance.hueRotate = 0.3 + Math.random() * 0.6;




    this.bounceLeft = this.matter.add.rectangle(325, 425, 150, 10, { isStatic: true, isSensor: false });
    this.bounceRight = this.matter.add.rectangle(475, 425, 150, 10, { isStatic: true, isSensor: false });
    this.bounceLeft.collisionFilter = {
      category: this.CATEGORY_PLATFORM,
      mask: this.CATEGORY_ORB,
      group: 0,
    };
    this.bounceRight.collisionFilter = {
      category: this.CATEGORY_PLATFORM,
      mask: this.CATEGORY_ORB,
      group: 0,
    };


    this.input.on('pointerdown', (pointer: any) => {
      this.createOrb(pointer.x, pointer.y);

    });
  }


}
