import { EventDispatcher } from "EventDispatcher";
import HslAdjustPostFxPipeline from "phaser3-rex-plugins/plugins/hsladjustpipeline";
import HslAdjustPipelinePlugin from "phaser3-rex-plugins/plugins/hsladjustpipeline-plugin";
import { CollisionCategory } from "../collision_category";

interface CharacterEventsMap {
    newOrb(event: NewOrbEvent): void;
    counter(event: CounterEvent): void;
    death(): void;
}
export class NewOrbEvent extends Event {
    constructor(public orb: OrbItem) {
        super('newOrb');
    }
}

export class CounterEvent extends Event {
    constructor(public counter: number) {
        super('counter');
    }
}

export class CharacterController extends EventDispatcher<CharacterEventsMap> {
    counter = 0;
    death: boolean = false;
    modules: Module[] = [];
    effects: Effect[] = [];
    hslPipeline: HslAdjustPostFxPipeline;
    orbTween?: Phaser.Tweens.Tween;


    constructor(public scene: Phaser.Scene, public character: Phaser.GameObjects.GameObject, public collideBox: MatterJS.BodyType) {
        super({ validEventTypes: ['newOrb', 'counter', 'death'] });
        this.hslPipeline = (this.scene.plugins.get('rexHSLAdjustPipeline') as HslAdjustPipelinePlugin).add(this.character, {});
    }

    static preload(scene: Phaser.Scene) {
        scene.load.audio('character_pop', 'assets/376968__elmasmalo1__bubble-pop.wav');
        scene.load.audio('character_hurt', 'assets/y2mate.com - Minecraft hit sound  1080p60fps.mp3');
    };

    addModule(module: Module) {
        this.modules.push(module);
        // this.orbs.push(...module.orbs);
        module.init(this, this.scene);
    }

    pickOrbEntry(): WeightEntry {
        let orbsEntries = this.modules.flatMap(m => m.getOrbWeightEntries());
        for (let i = 0; i++; i < orbsEntries.length - 1) {
            orbsEntries[i + 1].weight += orbsEntries[i].weight;
        }
        let rand = Math.random() * orbsEntries[orbsEntries.length - 1].weight;
        return orbsEntries.find(e => e.weight > rand)!;
    }

    createOrb(x: number, y: number) {
        let picked = this.pickOrbEntry();
        let orb = picked.createOrb(x + Phaser.Math.Between(-60, 60), y + Phaser.Math.Between(-20, 20));
        this.collideBox.setOnCollideWith(orb.obj.body as MatterJS.BodyType, () => {
            this.onOrbCollide(orb);
        });
        this.trigger(new NewOrbEvent(orb));
    }

    onOrbCollide(orb: OrbItem) {
        this.counter++;
        orb.applyAction();
        this.orbTween?.remove();
        this.orbTween = this.scene.tweens.add({
            targets: this.character,
            scaleX: 0.22,
            scaleY: 0.18,
            duration: 50,
            ease: 'Sine.inOut',
            yoyo: true,
        });
        (this.character as unknown as Phaser.GameObjects.Components.Transform).setScale(0.2, 0.2);
        this.scene.sound.play('character_pop', { volume: 0.2 });

        this.trigger(new CounterEvent(this.counter));
        if (this.death) {
            let forceX = 0.01 + Phaser.Math.FloatBetween(0, 0.01);
            if (Math.random() > 0.5) {
                forceX = -forceX;
            }
            this.scene.matter.world.once('afterupdate', () => {
                if (orb.obj.body != undefined)
                    (orb.obj as unknown as Phaser.Physics.Matter.Components.Force).applyForce(new Phaser.Math.Vector2(forceX, -0.01));
            });
        } else {
            orb.destroy();
        }
    }

    hurt() {
        this.scene.sound.play('character_hurt', {
            start: 0.78,
            name: 'what_ever_is_this_i_dont_care',
            config: {
                volume: 0.8
            }
        });
        this.scene.cameras.main.shake(200, 0.005);
    }

    setDeath() {
        this.death = true;
        this.trigger('death');
    }

    addEffect(effect: Effect) {
        this.effects = this.effects.filter(e => !e.equal(effect));
        this.effects.push(effect);
        effect.apply();
    }

    update() {
        for (let effect of this.effects) {
            effect.update();
        }

    }
}

interface WeightEntry {
    weight: number;
    createOrb: (x: number, y: number) => OrbItem;
}

export class Module {
    public controller!: CharacterController;
    public scene!: Phaser.Scene;
    orbs: OrbEntry[] = [];

    constructor() { }

    static preload(scene: Phaser.Scene) { }

    init(controller: CharacterController, scene: Phaser.Scene) {
        this.controller = controller;
        this.scene = scene;
    }

    builderWrapper(builder: (x: number, y: number) => OrbItem) {
        return (x: number, y: number) => {
            //...
            return builder(x, y);
        };
    }

    getOrbWeightEntries(): WeightEntry[] {
        return this.orbs.map(orb => ({ weight: orb.weight, createOrb: this.builderWrapper((x: number, y: number) => orb.createOrb(x, y, this)) }));
    }

}

export class OrbEntry {
    constructor(
        public weight: number,
        private builder: (x: number, y: number, module: Module) => OrbItem,
        public preload: (scene: Phaser.Scene) => void,
    ) { }

    createOrb(x: number, y: number, module: Module): OrbItem {
        let orb = this.builder(x, y, module);
        return orb;
    };
}


export abstract class OrbItem {
    obj: Phaser.GameObjects.GameObject;
    constructor(x: number, y: number, public module: Module) {
        this.obj = this.createObj(x, y);
        this.configObj();
    }

    abstract createObj(x: number, y: number): Phaser.GameObjects.GameObject;

    configObj() {
        (this.obj as unknown as Phaser.Physics.Matter.Components.Collision).setCollisionCategory(CollisionCategory.CATEGORY_ORB);
        (this.obj as unknown as Phaser.Physics.Matter.Components.Bounce).setBounce(0.5);
        (this.obj as unknown as Phaser.Physics.Matter.Components.Velocity).setAngularVelocity(Phaser.Math.FloatBetween(-0.2, 0.2));
        //TODO: 應該有更適合的地方用來播放音效
        this.module.scene.sound.play('book', {
            start: 0.45,

            name: 'what_ever_is_this_i_dont_care',
            config: {
                volume: 0.7,
                rate: 0.3,
            }
        });
    }

    abstract applyAction(): void;

    destroy() {
        this.obj.destroy();
    }
}

export abstract class Effect {
    constructor(public module: Module) { }
    abstract apply(): void;
    abstract update(): void;

    equal(effect: Effect) {
        return effect.constructor == this.constructor;
    }
}