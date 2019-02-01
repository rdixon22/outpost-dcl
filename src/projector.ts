import { SpriteSheet } from "./spritesheet";
import { SpriteShape } from "./spriteshape";

@Component("Projector")
export class Projector {

  public ent:Entity;
  public modelEntity:Entity;
  public modelFile:string;
  public shape:GLTFShape;

  public idleAnim:AnimationClip;
  public attackAnim:AnimationClip;
  public damageAnim:AnimationClip;

  public attackFx:SpriteSheet;
  public idleFx:SpriteSheet;
  public damageFx:SpriteSheet;

  constructor(_name:string, _modelFile:string, _position: Vector3, _scale: Vector3) {
    this.modelFile = _modelFile;
    this.ent = new Entity();
    this.ent.set(new Transform({ position: _position }));
    engine.addEntity(this.ent);

    this.modelEntity = this.loadModel(_modelFile, _position, _scale);
    this.modelEntity.setParent(this.ent);
    engine.addEntity(this.modelEntity);

    this.ent.set(
      new OnClick(() => {
        this.attack();
      })
    )
  }

  loadModel(_filename: string, _position: Vector3, _scale: Vector3) {
    // create the entity
    const mod = new Entity();
  
    this.shape = new GLTFShape("models/" + _filename);
    log("Loading file: models/" + _filename);
    mod.set(this.shape);

    mod.set(new Transform({ scale: _scale})); // position: _position, 

    this.attackAnim = new AnimationClip("MeleeAttack", {loop: false});
    this.shape.addClip(this.attackAnim);

    this.damageAnim = new AnimationClip("Damage", {loop: false});
    this.shape.addClip(this.damageAnim);

    this.idleAnim = new AnimationClip("Idle", {loop: true, speed: 0.5});
    this.shape.addClip(this.idleAnim);
  
    return mod;
  }

  getShape() {
    return this.modelEntity.get(GLTFShape);
  }

  update(dt: number) {

  }

  attack() {
    log("attackAnim.playing=" + this.attackAnim.playing + ", dirty=" + this.attackAnim.dirty);
    //this.attackAnim = new AnimationClip("MeleeAttack", {loop: false});
    //if (this.attackAnim.playing) return;
    this.attackAnim.playing = false;
    log("attackAnim.playing=" + this.attackAnim.playing + ", dirty=" + this.attackAnim.dirty);
    this.attackAnim.play();
    if (this.attackFx)
    {
      this.attackFx.entity.alive = true;
      this.attackFx.animate();
    }
  }

  damage() {
    this.damageAnim.play();
    if (this.damageFx)
    {
      this.damageFx.entity.alive = true;
      this.damageFx.animate();
    }
  }

  idle() {
    this.idleAnim.play();
    if (this.idleFx)
    {
      this.idleFx.animate(true);
    }
  }

  addIdleFx(_pos:Vector3, _rot:Vector3, _fileName:string, _color:Color3, _framesX: number = 1, _framesY: number = 1, _staticFrame:number = 0, _w: number = 1, _h: number = 1)
  {
    const spriteFx = this.createSpritePlane(_pos, _rot, _fileName, _color, _framesX, _framesY, _staticFrame, _w, _h);
    spriteFx.alive = false;
    this.idleFx = spriteFx.get(SpriteSheet);
    //log("spritePlane.pos=" + JSON.stringify(spriteFx.get(Transform).position));
  }

  addAttackFx(_pos: Vector3, _rot: Vector3, _fileName:string, _color:Color3, _framesX: number = 1, _framesY: number = 1, _staticFrame:number = 0, _w: number = 1, _h: number = 1)
  {
    const spriteFx = this.createSpritePlane(_pos, _rot, _fileName, _color, _framesX, _framesY, _staticFrame, _w, _h);
    spriteFx.alive = false;
    this.attackFx = spriteFx.get(SpriteSheet);
  }

  addDamageFx(_pos: Vector3, _rot: Vector3, _fileName:string, _color:Color3, _framesX: number = 1, _framesY: number = 1, _staticFrame:number = 0, _w: number = 1, _h: number = 1)
  {
    const spriteFx = this.createSpritePlane(_pos, _rot, _fileName, _color, _framesX, _framesY, _staticFrame, _w, _h);
    spriteFx.alive = false;
    this.damageFx = spriteFx.get(SpriteSheet);
  }

  createSpritePlane(_pos: Vector3, _rot: Vector3, _fileName:string, _color:Color3, _framesX: number = 1, _framesY: number = 1, _staticFrame:number = 0, _w: number = 1, _h: number = 1)
  {
    const spritePlane = new Entity();
    var sheet = new SpriteSheet(spritePlane, _fileName, _color,  _framesX, _framesY, _staticFrame, _w, _h);
    spritePlane.set(sheet);
    spritePlane.setParent(this.ent);

    spritePlane.set(new Transform({ position: _pos }));
    spritePlane.get(Transform).rotation.eulerAngles = _rot;
    
    engine.addEntity(spritePlane); 
    return spritePlane;
  }
}