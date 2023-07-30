import Phaser from 'phaser';
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
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  plugins: {
    global: [{
      key: 'rexHSLAdjustPipeline',
      plugin: HSLAdjustPipelinePlugin,
      start: true
    },
      // ...
    ]
  }
};
