import * as Phaser from 'phaser';
import { CollisionCategory } from '../collision_category';
import { CharacterController, EffectState, SoundType } from '../module/controller';
import { POEModule } from '../module/poe.module';
import { Invincible, InvincibleStar, MarioModule } from '../module/mario.module';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import { ApiClient } from '@twurple/api';
import { AuthProvider, StaticAuthProvider } from '@twurple/auth';
import { MockAuthProvider } from '../twitch/mock_auth_provider';
import { ChatClient, ChatMessage } from '@twurple/chat';
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
    '喔不！一只野生魯克魚龍誤食幻色石搞丟了自己的顏色\n繼續餵食幻色石幫助他找回原本的顏色吧！！',
    '沒錯，繼續下去！',
    '。。。',
    '他看起來像是幻色石中毒了',
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
    MarioModule.preload(this);
  }

  getConfig(): Config {
    let params = (new URL(location.href)).searchParams;
    return {
      twitch: params.get('twitch') as "none" | "point" | "chat" ?? 'none',
      mock: params.get('mock') === 'true' ?? false,
      clientId: params.get('clientId'),
      accessToken: params.get('accessToken'),
      userId: params.get('userId'),
      channel: params.get('channel'),
    }
  }

  initTwitch(config: Config) {
    if (config.twitch === 'point') {

      if (config.clientId == null || config.accessToken == null || config.userId == null) {
        let errorText = this.add.text(150, 500, this.texts[0],
          {
            fontSize: '20px',
            align: 'center',
            color: '#ff0000'
          },).setPadding(2);
        errorText.text = 'Twitch Point Mode 初始化失敗，缺少 clientId 或 accessToken 或 userId';
        return false;
      }

      let authProvider: AuthProvider;
      if (config.mock) {
        authProvider = new MockAuthProvider(config.clientId!, config.accessToken!, config.userId);
      } else {
        authProvider = new StaticAuthProvider(config.clientId!, config.accessToken!);
      }

      const listener = new EventSubWsListener({
        apiClient: new ApiClient({
          authProvider: authProvider,
          mockServerPort: config.mock ? 8080 : undefined,
        }),
      });
      listener.onChannelRedemptionAddForReward(config.userId, 'colorOrb', (data) => {
        this.controller.createOrb(400 + Phaser.Math.Between(-150, 150), 100);
      });
      listener.start();
    }

    if (config.twitch === 'chat') {
      if (config.channel == null) {
        let errorText = this.add.text(150, 500, this.texts[0],
          {
            fontSize: '20px',
            align: 'center',
            color: '#ff0000'
          },).setPadding(2);
        errorText.text = 'Twitch Chat Mode 初始化失敗，缺少 channel 參數';
        return false;
      }

      const chatClient = new ChatClient({ channels: [config.channel] });
      chatClient.connect();
      const keywords = [
        '幻色石',
        'chromatic',
      ];
      const commandRegex = new RegExp(`!(${keywords.join('|')})`);
      chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        if (commandRegex.test(msg.text)) {
          this.controller.createOrb(400 + Phaser.Math.Between(-150, 150), 100);
        }
      });
    }
    return true;

  }


  create() {
    let config = this.getConfig();
    if (config.twitch !== 'none') {
      if (!this.initTwitch(config)) {
        return;
      }
    }

    if (config.twitch === 'none') {
      this.cameras.main.setBackgroundColor("#090300");
    }


    this.display = this.add.text(150, 500, this.texts[0],
      {
        fontSize: '20px',
        align: 'center',
        color: config.twitch !== 'none' ? '#000000' : '#b9b079',
      },).setPadding(2);
    // this.display.visible = !config.twitch;
    this.add.image(400, 50, 'spot').setScale(0.4, 0.6).setVisible(config.twitch === 'none');

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
    this.controller.addModule(new MarioModule());

    this.controller.colorEffect.hue((0.3 + Math.random() * 0.6) * 360);

    this.input.on('pointerdown', (pointer: any) => {
      this.controller.createOrb(pointer.x, pointer.y);
    });
    this.controller.on('orb', (event) => {
      let orb = event.orb.obj as unknown as (Phaser.Physics.Matter.Components.Collision & Phaser.Physics.Matter.Components.Force & Phaser.GameObjects.GameObject);
      orb.setCollidesWith(CollisionCategory.CATEGORY_PLATFORM);
      orb.setOnCollideWith(this.bounceRight, () => {
        this.matter.world.once('afterupdate', () => {
          if (orb.body != undefined)
            orb.applyForce(new Phaser.Math.Vector2(0.01 + Phaser.Math.FloatBetween(0, 0.01), -0.015 + Phaser.Math.FloatBetween(-0.01, 0)));
        });
        event.orb.triggerSound(SoundType.bounceHard, '*');
      });
      orb.setOnCollideWith(this.bounceLeft as MatterJS.BodyType, () => {
        this.matter.world.once('afterupdate', () => {
          if (orb.body != undefined)
            orb.applyForce(new Phaser.Math.Vector2(-(0.01 + Phaser.Math.FloatBetween(0, 0.01)), -0.015 + Phaser.Math.FloatBetween(-0.01, 0)));
        });
        event.orb.triggerSound(SoundType.bounceHard, '*');
      });
    });

    this.controller.on('counter', (event) => {
      if (event.counter == 70) {
        this.display.text = this.texts[4];
        this.controller.setDeath();
      } else if (event.counter == 50) {
        this.display.text = this.texts[3];
      } else if (event.counter == 20) {
        this.display.text = this.texts[2];
      } else if (event.counter == 5) {
        this.display.text = this.texts[1];
      }
    });

    this.controller.on('orb', (event) => {
      if (event.orb instanceof InvincibleStar) {
        this.display.text = '無敵星星。。';
      }
    });
    this.controller.on('effect', (event) => {
      if (event.effect instanceof Invincible && event.state === EffectState.inactive) {
        this.display.text = '沒有用啊！！！！！';
      }
    })
  }

  update(time: number, delta: number): void {
    this.controller?.update(time, delta);
  }
}




interface Config {
  twitch: 'point' | 'chat' | 'none';
  mock: boolean;
  clientId: string | null;
  accessToken: string | null;
  userId: string | null;
  channel: string | null;
}