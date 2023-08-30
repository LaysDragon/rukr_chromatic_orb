import * as Phaser from 'phaser';
import { EventDispatcher } from "EventDispatcher";
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
    orbTween?: Phaser.Tweens.Tween;
    colorEffect: Phaser.FX.ColorMatrix;


    constructor(public scene: Phaser.Scene, public character: Phaser.GameObjects.GameObject, public collideBox: MatterJS.BodyType) {
        super({ validEventTypes: ['newOrb', 'counter', 'death'] });
        this.colorEffect = (this.character as unknown as Phaser.GameObjects.Components.PostPipeline).postFX.addColorMatrix();
    }

    static preload(scene: Phaser.Scene) {
        scene.load.audio('character_pop', 'assets/376968__elmasmalo1__bubble-pop.wav');
        scene.load.audio('character_hurt', 'assets/y2mate.com - Minecraft hit sound  1080p60fps.mp3');
    };

    addModule(module: Module) {
        this.modules.push(module);
        module.init(this, this.scene);
    }

    pickOrbEntry(): WeightEntry {
        let orbsEntries = this.modules.flatMap(m => m.getOrbWeightEntries());
        for (let i = 0; i < orbsEntries.length - 1; i++) {
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
        // this.orbTween?.remove();
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
        let oldEffectIndex = this.effects.findIndex(e => e.equal(effect));
        let oldEffect = this.effects[oldEffectIndex];
        if (oldEffect !== undefined) {
            if (oldEffect.skipRepeat) {
                if (oldEffect.resetTimerOnRepeat && oldEffect.timer > 0) {
                    clearTimeout(oldEffect.timerHolder);
                    oldEffect.timerHolder = setTimeout(() => { this.removeEffect(effect); }, oldEffect.timer);
                }

                oldEffect.reapply(effect);
                return;
            }

            this.effects.splice(oldEffectIndex, 1);
            oldEffect.inactive();
        }
        this.effects.push(effect);
        if (effect.timer > 0) {
            effect.timerHolder = setTimeout(() => { this.removeEffect(effect); }, effect.timer);
        }
        effect.apply();
    }

    removeEffect(effect: Effect): Effect | undefined {
        let oldEffectIndex = this.effects.findIndex(e => e.equal(effect));
        let oldEffect = this.effects[oldEffectIndex];
        if (oldEffect !== undefined) {
            clearTimeout(oldEffect.timerHolder);
            oldEffect.inactive();
            this.effects.splice(oldEffectIndex, 1);
            return;
        }
        return;
    }

    update(time: number, delta: number) {
        for (let module of this.modules) {
            module.update(time, delta);
        }
        for (let effect of this.effects) {
            effect.update(time, delta);
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
    orbInstances: OrbItem[] = [];

    constructor() { }

    static preload(scene: Phaser.Scene) { }

    init(controller: CharacterController, scene: Phaser.Scene) {
        this.controller = controller;
        this.scene = scene;
    }

    builderWrapper(builder: (x: number, y: number) => OrbItem) {
        return (x: number, y: number) => {
            let instance = builder(x, y);
            this.orbInstances.push(instance)
            return instance;
        };
    }

    update(time: number, delta: number): void {
        for (let orb of this.orbInstances) {
            orb.update(time, delta);
        }
    }

    onOrbDestroyed(orb: OrbItem) {
        this.orbInstances = this.orbInstances.filter(o => orb !== o);
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


export abstract class OrbItem<T extends Phaser.GameObjects.GameObject = Phaser.GameObjects.GameObject> {
    static entry: OrbEntry;
    obj: T;
    constructor(x: number, y: number, public module: Module) {
        this.obj = this.createObj(x, y);
        this.configObj();
    }

    abstract createObj(x: number, y: number): T;

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

    abstract update(time: number, delta: number): void;

    abstract applyAction(): void;
    abstract bounceSound(): void;

    destroy() {
        this.module.onOrbDestroyed(this);
        this.obj.destroy();
    }
}

export abstract class Effect {
    static preload(scene: Phaser.Scene) { }
    constructor(public module: Module) { }
    skipRepeat = true;

    /** timer manage by controller */
    resetTimerOnRepeat = true;
    timer = 0;
    timerHolder?: number;

    abstract apply(): void;
    abstract reapply(effect: this): void;
    abstract inactive(): void;
    abstract update(time: number, delta: number): void;

    equal(effect: Effect) {
        return effect.constructor == this.constructor;
    }
}