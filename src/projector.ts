import { SpriteShape } from "./spriteshape";

@Component("Projector")
export class Projector {

  public ent:Entity;
  public modelEntity:Entity;
  public modelFile:string;
  public shape:GLTFShape;

  public idleAnim:AnimationClip;
  public attackAnim:AnimationClip;
  public broadcastAnim:AnimationClip;

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
        this.broadcast();
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

    this.attackAnim = new AnimationClip("Attack", {loop: false});
    this.shape.addClip(this.attackAnim);

    this.broadcastAnim = new AnimationClip("Broadcast", {loop: false});
    this.shape.addClip(this.broadcastAnim);

    this.idleAnim = new AnimationClip("Idle", {loop: true, speed: 0.5});
    this.shape.addClip(this.idleAnim);
  
    return mod;
  }

  getShape() {
    return this.modelEntity.get(GLTFShape);
  }

  update(dt: number) {

  }

  broadcast()
  {

  }

  attack()
  {

  }

  idle()
  {

  }

}