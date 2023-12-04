import * as Phaser from 'phaser';

export default {
  type: Phaser.WEBGL,
  parent: 'game',
  transparent:true,
  scale: {
    width: 800,
    height: 600,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'matter',
    matter: {
      enableSleeping: true,
      // gravity: {
      //   y: 9.8
      // },
      debug: {
        showBody: false,
        showStaticBody: false,
      }
    }
  },
  plugins: {},
} as Phaser.Types.Core.GameConfig;
