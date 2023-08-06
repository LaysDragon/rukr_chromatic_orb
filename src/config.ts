import Phaser from 'phaser';
import PhaserMatterCollisionPlugin from 'phaser-matter-collision-plugin';
import HSLAdjustPipelinePlugin from 'phaser3-rex-plugins/plugins/hsladjustpipeline-plugin.js';

export default {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#090300',
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
        showStaticBody: false
      }
    }
  },
  plugins: {
    global: [{
      key: 'rexHSLAdjustPipeline',
      plugin: HSLAdjustPipelinePlugin,
      start: true
    },
    ],
    scene: [
      {
        plugin: PhaserMatterCollisionPlugin,
        key: 'matterCollision',
        mapping: 'matterCollision'
      }
    ]
  }
};
