@Component("Portable")
export class Portable {

  public ent:Entity;
  public trans:Transform; // de-reference the transform for speed
  public isHeld:boolean = false;
  
  private distance:float = 1.0;

  constructor(_entity:Entity) {
    this.ent = _entity;
    this.trans = _entity.getOrCreate(Transform);

    this.ent.set(
        new OnClick(() => {
          log("clicked on Portable object, isHeld=" + this.isHeld);
          if (this.isHeld)
          {
            this.drop();
          }
          else
          {
            this.carry();
          }
        })
    )
  }

  carry()
  {
    this.putInFront(0);
    this.isHeld = true;
  }

  drop()
  {
    this.isHeld = false;
    // Where to put it? Avatar camera is a certain height from the floor, but y coord is always zero.
    this.trans.position.y = Camera.instance.position. y + 0.1;
  }

  nextFrame(dt:number)
  {
    if (!this.isHeld) return;
    this.putInFront(dt);
  }

  putInFront(dt: number)
  {
    let newPos:Vector3 = Camera.instance.position.clone();
    newPos.y += 0.8;
    
    let angles:Vector3 = Camera.instance.rotation.eulerAngles;
    let radians:float = angles.y * (Math.PI / 180);
    newPos.x = newPos.x + (this.distance * Math.sin(radians));
    newPos.z = newPos.z + (this.distance * Math.cos(radians));

    //this.trans.position = newPos;

    // let's try smoothing this out...
    let lerpSpeed:number = 10;
    this.trans.position = Vector3.Lerp(
      this.trans.position,
      newPos,
      dt * lerpSpeed
    )
  }
}