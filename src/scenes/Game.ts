import Phaser from 'phaser';
import HslAdjustPostFxPipeline from 'phaser3-rex-plugins/plugins/hsladjustpipeline';
import HslAdjustPipelinePlugin from 'phaser3-rex-plugins/plugins/hsladjustpipeline-plugin';

export default class Demo extends Phaser.Scene {
  fish!: Phaser.GameObjects.Image;
  orbTween?: Phaser.Tweens.Tween;
  fishEatingBox!: Phaser.GameObjects.Rectangle;
  bounceRight!: Phaser.GameObjects.Rectangle;
  bounceLeft!: Phaser.GameObjects.Rectangle;
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
    this.load.image('logo', 'assets/phaser3-logo.png');
    this.load.image('orb', 'assets/CurrencyRerollSocketColours.webp');
    this.load.image('fish', 'assets/FlatFish.png');
    this.load.image('spot', 'assets/[CITYPNG.COM]Yellow Spot Light Spotlight Effect Transparent PNG - 2000x2000.png');
    this.load.image('death', 'assets/death.png');

    this.load.audio('pop', 'assets/376968__elmasmalo1__bubble-pop.wav');
    this.load.audio('ding', 'assets/411749__natty23__bell-ding.wav');
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

  createOrb(x: number, y: number) {
    const orb = this.physics.add.image(x, y, 'orb').setScale(0.4)
    orb.setBounce(0.1);

    this.sound.play('book', {
      start: 0.45,

      name: 'what_ever_is_this_i_dont_care',
      config: {
        volume: 0.5,
        rate: 0.3,
      }
    });

    this.physics.add.overlap(this.fishEatingBox, orb, () => {
      this.counter++;
      if (this.counter > 70) {
        this.display.text = this.texts[4];
        this.add.image(400, 300, 'death').setScale(0.7);
      } else if (this.counter > 50) {
        this.display.text = this.texts[3];
      } else if (this.counter > 20) {
        this.display.text = this.texts[2];
      } else if (this.counter > 5) {
        this.display.text = this.texts[1];
      }

      orb.destroy();
      this.orbTween?.remove();
      this.fish.setScale(0.2, 0.2);
      this.orbTween = this.tweens.add({
        targets: this.fish,
        scaleX: 0.22,
        scaleY: 0.18,
        duration: 50,
        ease: 'Sine.inOut',
        yoyo: true,
      });
      if (this.counter > 50) {
        this.fish.setTint(this.colors[Math.floor(Math.random() * this.colors.length)]);
      }
      this.fishPipelineInstance.hueRotate = 0.05 + Math.random() * 0.9;
      this.sound.play('pop');
    }, undefined, this);

    this.physics.add.overlap(this.bounceRight, orb, () => {
      orb.setVelocity(100, -250);
      this.sound.play('ding', { volume: 0.6, rate: 2 });
    }, undefined, this);
    this.physics.add.overlap(this.bounceLeft, orb, () => {
      orb.setVelocity(-100, -250);
      this.sound.play('ding', { volume: 0.6, rate: 2 });
    }, undefined, this);

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
    this.fishEatingBox = this.physics.add.existing(this.add.rectangle(400, 400, 80, 30), true);
    this.fishPipelineInstance = (this.plugins.get('rexHSLAdjustPipeline') as HslAdjustPipelinePlugin).add(this.fish, {});
    this.fishPipelineInstance.hueRotate = 0.3 + Math.random() * 0.6;




    this.physics.add.existing(this.fish);
    (this.fish.body as unknown as Phaser.Physics.Arcade.Body).setImmovable(true);
    (this.fish.body as unknown as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    this.bounceLeft = this.physics.add.existing(this.add.rectangle(325, 425, 150, 10), true);
    this.bounceRight = this.physics.add.existing(this.add.rectangle(475, 425, 150, 10), true);

    this.input.on('pointerdown', (pointer: any) => {
      this.createOrb(pointer.x, pointer.y);

    });
  }


}
